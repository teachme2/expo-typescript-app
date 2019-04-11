import { Errors } from "../utils/misc";
import { ApplicationStore } from "./ApplicationStore";

class APIErrorResp {
  msg: string;
  code: number;
  fields: { [field: string]: string };
}

export class ApiException implements Errors.UserError {
  userError: string;

  constructor(public readonly method: string, public readonly url: string, public readonly statusCode: number, public readonly statusText: string, public readonly reason: any, userError?: string) {
    this.userError = userError;
  }
}

interface LocalRootStore {
  applicationStore: ApplicationStore;
}

export class ApiStore {
  constructor(public readonly rootStore: LocalRootStore) {
    //console.log(`baseURL=${baseURL}`);
  }

  fetch = async (url: string, info: RequestInit) => {
    console.debug(`${info.method} ${url}`);
    if (!info) {
      info = {};
    }
    console.debug(`Req ${url} with headers ${info.headers}`);

    try {
      const response = await fetch(url, info);
      console.debug(`Resp ${response.status} from ${info.method} ${url}`);
      if ((200 <= response.status && response.status < 300) || response.status == 304 /* not modified */) {
        return Promise.resolve(response);
      } else {
        const jsn = (await response.json()) as APIErrorResp;
        return Promise.reject(new ApiException(info.method, url, response.status, response.statusText, response.statusText, this.getRespErrorMsg(jsn)));
      }
    } catch (e) {
      //console.log(`Resp to ${url} err: ${reason}`);
      console.debug(`error ${e} from ${info.method} ${url}`);
      return Promise.reject(new ApiException(info.method, url, 0, `${e}`, e, "Error calling API"));
    }
  };

  getRespErrorMsg(jsn: APIErrorResp) {
    let msg = "";
    if (jsn) {
      if (jsn.fields) {
        for (const field in jsn.fields) {
          msg += jsn.fields[field] + "\n";
        }
      } else {
        msg = jsn.msg;
      }
    }
    return msg;
  }
}
