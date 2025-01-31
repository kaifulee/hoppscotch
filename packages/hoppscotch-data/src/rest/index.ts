import * as Eq from "fp-ts/Eq"
import * as S from "fp-ts/string"
import cloneDeep from "lodash/cloneDeep"
import V0_VERSION from "./v/0"
import V1_VERSION from "./v/1"
import V2_VERSION from "./v/2"
import { createVersionedEntity, InferredEntity } from "verzod"
import { lodashIsEqualEq, mapThenEq, undefinedEq } from "../utils/eq"
import {
  HoppRESTAuth,
  HoppRESTReqBody,
  HoppRESTHeaders,
  HoppRESTParams,
} from "./v/1"
import { HoppRESTRequestVariables } from "./v/2"
import { z } from "zod"

export * from "./content-types"
export {
  FormDataKeyValue,
  HoppRESTReqBodyFormData,
  HoppRESTAuth,
  HoppRESTAuthAPIKey,
  HoppRESTAuthBasic,
  HoppRESTAuthInherit,
  HoppRESTAuthBearer,
  HoppRESTAuthNone,
  HoppRESTAuthOAuth2,
  HoppRESTReqBody,
  HoppRESTHeaders,
} from "./v/1"

export { HoppRESTRequestVariables } from "./v/2"

const versionedObject = z.object({
  // v is a stringified number
  v: z.string().regex(/^\d+$/).transform(Number),
})

export const HoppRESTRequest = createVersionedEntity({
  latestVersion: 2,
  versionMap: {
    0: V0_VERSION,
    1: V1_VERSION,
    2: V2_VERSION,
  },
  getVersion(data) {
    // For V1 onwards we have the v string storing the number
    const versionCheck = versionedObject.safeParse(data)

    if (versionCheck.success) return versionCheck.data.v

    // For V0 we have to check the schema
    const result = V0_VERSION.schema.safeParse(data)

    return result.success ? 0 : null
  },
})

export type HoppRESTRequest = InferredEntity<typeof HoppRESTRequest>

// TODO: Handle the issue with the preRequestScript and testScript type check failures on pre-commit
const HoppRESTRequestEq = Eq.struct<HoppRESTRequest>({
  id: undefinedEq(S.Eq),
  v: S.Eq,
  auth: lodashIsEqualEq,
  body: lodashIsEqualEq,
  endpoint: S.Eq,
  headers: mapThenEq(
    (arr) => arr.filter((h: any) => h.key !== "" && h.value !== ""),
    lodashIsEqualEq
  ),
  params: mapThenEq(
    (arr) => arr.filter((p: any) => p.key !== "" && p.value !== ""),
    lodashIsEqualEq
  ),
  method: S.Eq,
  name: S.Eq,
  preRequestScript: S.Eq,
  testScript: S.Eq,
  requestVariables: mapThenEq(
    (arr) => arr.filter((v: any) => v.key !== "" && v.value !== ""),
    lodashIsEqualEq
  ),
})

export const RESTReqSchemaVersion = "2"

export type HoppRESTParam = HoppRESTRequest["params"][number]
export type HoppRESTHeader = HoppRESTRequest["headers"][number]
export type HoppRESTRequestVariable =
  HoppRESTRequest["requestVariables"][number]

export const isEqualHoppRESTRequest = HoppRESTRequestEq.equals

/**
 * Safely tries to extract REST Request data from an unknown value.
 * If we fail to detect certain bits, we just resolve it to the default value
 * @param x The value to extract REST Request data from
 * @param defaultReq The default REST Request to source from
 *
 * @deprecated Usage of this function is no longer recommended and is only here
 * for legacy reasons and will be removed
 */
export function safelyExtractRESTRequest(
  x: unknown,
  defaultReq: HoppRESTRequest
): HoppRESTRequest {
  const req = cloneDeep(defaultReq)

  if (!!x && typeof x === "object") {
    if ("id" in x && typeof x.id === "string") req.id = x.id

    if ("name" in x && typeof x.name === "string") req.name = x.name

    if ("method" in x && typeof x.method === "string") req.method = x.method

    if ("endpoint" in x && typeof x.endpoint === "string")
      req.endpoint = x.endpoint

    if ("preRequestScript" in x && typeof x.preRequestScript === "string")
      req.preRequestScript = x.preRequestScript

    if ("testScript" in x && typeof x.testScript === "string")
      req.testScript = x.testScript

    if ("body" in x) {
      const result = HoppRESTReqBody.safeParse(x.body)

      if (result.success) {
        req.body = result.data
      }
    }

    if ("auth" in x) {
      const result = HoppRESTAuth.safeParse(x.auth)

      if (result.success) {
        req.auth = result.data
      }
    }

    if ("params" in x) {
      const result = HoppRESTParams.safeParse(x.params)

      if (result.success) {
        req.params = result.data
      }
    }

    if ("headers" in x) {
      const result = HoppRESTHeaders.safeParse(x.headers)

      if (result.success) {
        req.headers = result.data
      }
    }

    if ("requestVariables" in x) {
      const result = HoppRESTRequestVariables.safeParse(x.requestVariables)

      if (result.success) {
        req.requestVariables = result.data
      }
    }
  }

  return req
}

export function makeRESTRequest(
  x: Omit<HoppRESTRequest, "v">
): HoppRESTRequest {
  return {
    v: RESTReqSchemaVersion,
    ...x,
  }
}

export function getDefaultRESTRequest(): HoppRESTRequest {
  return {
    v: "2",
    endpoint: "https://echo.hoppscotch.io",
    name: "Untitled",
    params: [],
    headers: [],
    method: "GET",
    auth: {
      authType: "inherit",
      authActive: true,
    },
    preRequestScript: "",
    testScript: "",
    body: {
      contentType: null,
      body: null,
    },
    requestVariables: [],
  }
}

/**
 * Checks if the given value is a HoppRESTRequest
 * @param x The value to check
 *
 * @deprecated This function is no longer recommended and is only here for legacy reasons
 * Use `HoppRESTRequest.is`/`HoppRESTRequest.isLatest` instead.
 */
export function isHoppRESTRequest(x: unknown): x is HoppRESTRequest {
  return HoppRESTRequest.isLatest(x)
}

/**
 * Safely parses a value into a HoppRESTRequest.
 * @param x The value to check
 *
 * @deprecated This function is no longer recommended and is only here for
 * legacy reasons. Use `HoppRESTRequest.safeParse` instead.
 */
export function translateToNewRequest(x: unknown): HoppRESTRequest {
  const result = HoppRESTRequest.safeParse(x)
  return result.type === "ok" ? result.value : getDefaultRESTRequest()
}
