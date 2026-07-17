/* Minimal leveled logger. Swap this out for pino/winston if you'd like —
 * it's kept dependency-free so the server has no extra setup requirements. */

type LogFields = Record<string, unknown>;

function format(level: string, fields: LogFields | undefined, msg: string) {
  const time = new Date().toISOString();
  if (fields && Object.keys(fields).length) {
    return `[${time}] ${level.toUpperCase()} ${msg} ${JSON.stringify(fields)}`;
  }
  return `[${time}] ${level.toUpperCase()} ${msg}`;
}

export const logger = {
  info(fieldsOrMsg: LogFields | string, msg?: string) {
    if (typeof fieldsOrMsg === "string") {
      console.log(format("info", undefined, fieldsOrMsg));
    } else {
      console.log(format("info", fieldsOrMsg, msg ?? ""));
    }
  },
  warn(fieldsOrMsg: LogFields | string, msg?: string) {
    if (typeof fieldsOrMsg === "string") {
      console.warn(format("warn", undefined, fieldsOrMsg));
    } else {
      console.warn(format("warn", fieldsOrMsg, msg ?? ""));
    }
  },
  error(fieldsOrMsg: LogFields | string, msg?: string) {
    if (typeof fieldsOrMsg === "string") {
      console.error(format("error", undefined, fieldsOrMsg));
    } else {
      console.error(format("error", fieldsOrMsg, msg ?? ""));
    }
  },
};
