import { SQLite } from "expo";
import { Strings } from "./utils/strings";
import { Assert } from "./utils/assert";

let lastId: number;

function idGenerator() {
  let newId = new Date().getTime();
  if (newId == lastId) {
    newId++;
  }
  lastId = newId;
  return lastId;
}

export class QueryPage {
  constructor(public limit: number = 100, public offset: number = 0) {}

  next() {
    return new QueryPage(this.limit, this.offset + this.limit);
  }
}

export class ModelDescriptor<T extends Model<any>> {
  tableName: string;
  columns: ModelColumn<T>[] = [];
  idType: string;

  constructor(tableName: string, primaryKeyType: "integer" | "text" = "integer") {
    this.tableName = tableName;
    this.idType = `id ${primaryKeyType} primary key not null`;
    this.withColumn(
      "id",
      this.idType,
      (t: T) => {
        return t.id;
      },
      (t: T, value: any) => {
        t.id = value;
      },
      idGenerator
    );
  }

  withUniqueColumn(columnName: string, columnDbType: string, getter: (t: T) => any, setter: (t: T, val: any) => void, generator?: () => any) {
    const c = new ModelColumn(columnName, columnDbType, getter, setter, generator);
    c.uniqueIndex = true;
    this.columns.push(c);
    return this;
  }

  withColumn(columnName: string, columnDbType: string, getter: (t: T) => any, setter: (t: T, val: any) => void, generator?: () => any) {
    this.columns.push(new ModelColumn(columnName, columnDbType, getter, setter, generator));
    return this;
  }
}

class ModelColumn<T extends Model<any>> {
  public uniqueIndex: boolean = false;
  constructor(
    public readonly columnName: string,
    public readonly columnDbType: string,
    public readonly getter: (t: T) => any,
    public readonly setter: (t: T, val: any) => void,
    public readonly generator?: () => any
  ) {}
}

export abstract class Model<T> {
  id: T;

  constructor() {}

  get key() {
    return this.id;
  }

  abstract getModelDescriptor(): ModelDescriptor<any>;
}

export class Dao {
  constructor(private readonly db: any) {
    this.log("test ? ? ?", [1, 2, "asd"]);
  }

  register(mClass: { new (): Model<any> }) {
    const m = new mClass();

    this.db.transaction((tx: SQLite.Transaction) => {
      const descr = m.getModelDescriptor();
      tx.executeSql(`create table if not exists ${descr.tableName} (id ${descr.idType})`);
      tx.executeSql(`pragma table_info(${descr.tableName})`, [], (tx, rs: SQLite.ResultSet) => {
        // {"_array":[{"cid":0,"name":"id","type":"integer","notnull":1,"dflt_value":null,"pk":1}],"length":1}
        //console.log("columns=" + JSON.stringify(rows));
        const columns: { [columnName: string]: boolean } = {};
        for (const row of rs.rows._array) {
          console.debug(`Found column ${descr.tableName}/${row.name} type=${row.type}`);
          columns[row.name] = true;
        }
        //console.log("columns=" + JSON.stringify(columns));
        for (const column of descr.columns) {
          if (!(column.columnName in columns)) {
            const alter = `alter table ${descr.tableName} add column ${column.columnName} ${column.columnDbType}`;
            this.log(alter);
            tx.executeSql(
              alter,
              null,
              tx => {
                console.log(`OK: ${alter}`);
                if (column.uniqueIndex) {
                  const uniqAlter = `CREATE UNIQUE INDEX IF NOT EXISTS ${column.columnName}_unique_idx ON ${descr.tableName}(${column.columnName});`;
                  tx.executeSql(uniqAlter, null, () => console.log(`OK: ${uniqAlter}`), (_, err) => console.error("err: " + err + " " + uniqAlter));
                }
              },
              (_, err) => console.error("err: " + err + " " + alter)
            );
          }
        }
        //console.log("columns=", JSON.stringify(columns));
      });
    });
  }

  /** Load and fails if the row is not found. */
  async load<T extends Model<any>>(mClass: { new (): T }, id?: any): Promise<T> {
    try {
      return Promise.resolve(await this.loadIfExists(mClass, id));
    } catch (err) {
      return Promise.reject(err);
    }
  }

  prepareSelectQuery(columnsList: string | true, desc: ModelDescriptor<any>, where: string, page: QueryPage = undefined) {
    const whereLower = where.trim().toLowerCase();
    if (where && (whereLower.indexOf("order") < 0 && whereLower.indexOf("limit") < 0 && whereLower.indexOf("where"))) {
      where = "where " + where;
    }

    let columns = "";
    if (columnsList === true) {
      for (const column of desc.columns) {
        if (columns) columns += ", ";
        columns += column.columnName;
      }
    } else {
      columns = columnsList as string;
    }
    let sql = `select ${columns} from ${desc.tableName} ${where || ""}`;
    if (page) {
      sql += ` limit ${page.limit} offset ${page.offset}`;
    }
    return sql;
  }

  /** Not an error if model is not found (returns null). */
  loadIfExists<T extends Model<any>>(mClass: { new (): T }, id?: any): Promise<T> {
    const that = this;
    const m = new mClass();
    if (id) {
      m.id = id;
    } else {
      return Promise.reject(new Error("Empty id"));
    }

    const sql = this.prepareSelectQuery(true, m.getModelDescriptor(), `where id=?`);
    this.log(sql, [id]);
    return new Promise<T>((resolve, reject) => {
      that.db.transaction((tx: SQLite.Transaction) => {
        tx.executeSql(
          sql,
          [id],
          (_, rs: SQLite.ResultSet) => {
            //console.log(`rows affected ${this.getRowsAffected(rs)}`);
            if (rs.rows.length != 1) {
              resolve(null);
              return;
            }
            try {
              that.mapRowToObject(rs.rows._array[0], m);
              resolve(m);
            } catch (e) {
              console.error(`Error running: ${sql}: ${e}`);
              reject(e);
            }
          },
          (_, err) => {
            console.error(`Error running: ${sql}: ${err}`);
            reject(err);
          }
        );
      });
    });
  }

  insert<T extends Model<any>>(m: T) {
    //console.log("saving:" + JSON.stringify(m));
    const that = this;
    const desc = m.getModelDescriptor();
    let values: any[] = [];

    var sql: string;

    // console.log(`m.id=${m.id}, ${!!m.id}`);

    let columns: string[] = [];
    let valsString: string[] = [];
    for (const column of desc.columns) {
      columns.push(column.columnName);
      valsString.push("?");
      const val = column.getter(m);
      //console.debug(`column ${column.columnName}, val=${JSON.stringify(val)}`);
      if (!val && column.generator) {
        const generated = column.generator();
        values.push(generated);
        column.setter(m, generated);
      } else {
        values.push(val);
      }
    }

    sql = `insert into ${desc.tableName} (${Strings.joinStrings(columns, ", ")}) values (${Strings.joinStrings(valsString, ", ")})`;
    this.log(sql, values);

    //console.log(`insert params ${JSON.stringify(values)}`);

    return new Promise<Model<any>>((resolve, reject) => {
      that.db.transaction((tx: SQLite.Transaction) => {
        tx.executeSql(
          sql,
          values,
          (_, rs: SQLite.ResultSet) => {
            //console.log("rows after insert=" + JSON.stringify(rs));
            //console.log(this.getRowsAffected(rs));
            if (rs.rowsAffected != 1) {
              reject(new Error(`not found ${m.id}`));
              return;
            }
            resolve(m);
          },
          (_, err) => {
            console.error(`Error running: ${sql}: ${err}`);
            reject(err);
          }
        );
      });
    });
  }

  saveOrUpdate<T extends Model<any>>(m: T) {
    if (m.id) {
      return this.update(m);
    }
    return this.insert(m);
  }

  update<T extends Model<any>>(m: T) {
    // console.log("saving:" + JSON.stringify(m));
    const that = this;
    const desc = m.getModelDescriptor();
    let values: any[] = [];

    var sql: string;

    // console.log(`m.id=${m.id}, ${!!m.id}`);

    let set = [];
    for (const column of desc.columns) {
      if (column.columnName != "id") {
        set.push(`${column.columnName}=?`);
        values.push(column.getter(m));
      }
    }
    values.push(m.id);
    sql = `update ${desc.tableName} set ${Strings.joinStrings(set, ", ")} where id=?`;
    this.log(sql, values);

    return new Promise<Model<any>>((resolve, reject) => {
      that.db.transaction((tx: SQLite.Transaction) => {
        tx.executeSql(
          sql,
          values,
          (_, rs: SQLite.ResultSet) => {
            // console.log("rows after save=" + JSON.stringify(rs.rows));
            if (rs.rowsAffected == 1) {
              resolve(m);
            } else {
              console.error(`Error running: ${sql}: rowsAffected=${rs.rowsAffected}`);
              reject(new Error(`not found ${m.id}`));
            }
          },
          (_, err) => {
            console.error(`Error running: ${sql}: ${err}`);
            reject(err);
          }
        );
      });
    });
  }

  deleteMany<T extends Model<any>>(models: T[]) {
    const promises = [];
    for (const m of models) {
      promises.push(this.delete(m));
    }
    return Promise.all(promises);
  }

  delete<T extends Model<any>>(m: T): Promise<void> {
    const that = this;
    const desc = m.getModelDescriptor();
    const sql = `delete from ${desc.tableName} where id=?`;
    this.log(sql, [m.id]);
    return new Promise<void>((resolve, reject) => {
      that.db.transaction((tx: SQLite.Transaction) => {
        tx.executeSql(
          sql,
          ["" + m.id],
          (_, rs: SQLite.ResultSet) => {
            if (rs.rowsAffected == 1) {
              resolve();
            } else {
              console.warn(`Error running: ${sql}: rowsAffected=${rs.rowsAffected}`);
              reject(new Error(`not found ${m.id}`));
            }
          },
          (_, err) => {
            console.error(`Error running: ${sql}: ${err}`);
            reject(err);
          }
        );
      });
    });
  }

  /**
   * Returns number of affected rows.
   */
  executeUpdate<T extends Model<any>>(m: { new (): T }, sql: string, params?: any[]): Promise<number> {
    const that = this;
    const desc = new m().getModelDescriptor();

    sql = `update ${desc.tableName} ${sql}`;
    this.log(sql, params);

    return new Promise<number>((resolve, reject) => {
      that.db.transaction((tx: SQLite.Transaction) => {
        tx.executeSql(
          sql,
          params,
          (_, rs: SQLite.ResultSet) => {
            resolve(rs.rowsAffected);
          },
          (_, err) => {
            reject(err);
          }
        );
      });
    });
  }

  count<T extends Model<any>>(m: { new (): T }, where: string, params?: any[], page: QueryPage = undefined): Promise<number> {
    const that = this;
    const desc = new m().getModelDescriptor();

    const sql = this.prepareSelectQuery("count(*) as _count", desc, where, page);
    this.log(sql, params);

    return new Promise<number>((resolve, reject) => {
      that.db.transaction((tx: SQLite.Transaction) => {
        tx.executeSql(
          sql,
          params,
          (_, rs: SQLite.ResultSet) => {
            for (const row of rs.rows._array) {
              const count = row["_count"] as number;
              resolve(count);
            }
            resolve(0);
          },
          (_, err) => {
            console.error(`Error running: ${sql}: ${err}`);
            reject(err);
          }
        );
      });
    });
  }

  query<T extends Model<any>>(m: { new (): T }, where: string, params?: any[], page: QueryPage = undefined): Promise<T[]> {
    const that = this;
    const desc = new m().getModelDescriptor();

    const sql = this.prepareSelectQuery(true, desc, where, page);
    this.log(sql, params);

    return new Promise<T[]>((resolve, reject) => {
      that.db.transaction((tx: SQLite.Transaction) => {
        tx.executeSql(
          sql,
          params,
          (_, rs: SQLite.ResultSet) => {
            // console.log("rows after save=" + JSON.stringify(rs.rows));
            const res: T[] = [];
            for (const row of rs.rows._array) {
              const r = new m();
              that.mapRowToObject(row, r);
              res.push(r);
            }
            resolve(res);
          },
          (_, err) => {
            console.error(`Error running: ${sql}: ${err}`);
            reject(err);
          }
        );
      });
    });
  }

  private mapRowToObject = (row: any, m: Model<any>) => {
    //console.log("mapping:" + JSON.stringify(row));
    Assert.assert(m, "missing model");
    Assert.assert(row, "missing row");
    //console.log(`row=${JSON.stringify(row)}`);
    for (const column of m.getModelDescriptor().columns) {
      if (!(column.columnName in row)) {
        console.error(`${column.columnName} not found in ${row}`);
      }
      const val = row[column.columnName];
      column.setter(m, val);
      //console.log(`after setting ${val} in ${column.columnName}, result is ${JSON.stringify(m)}`);
    }
  };

  private log = (sql: string, params: any[] = []) => {
    if (__DEV__) {
      let i = 0;
      sql = sql.replace(/\?/g, () => {
        const p = params[i++];
        //console.log(`${p} -> ${typeof p}`);
        switch (typeof p) {
          case "number":
            return "" + p;
          case "boolean":
            return "" + p;
          default:
            return "'" + p + "'";
        }
      });
      console.debug(`dbg sql=${sql}`);
    } else {
      console.debug(`sql=${sql} params=${params}`);
    }
  };
}
