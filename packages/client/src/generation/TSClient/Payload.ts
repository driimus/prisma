import indent from 'indent-string'

import { DMMF } from '../../runtime/dmmf-types'
import { getArgName, getModelArgName, getPayloadName, Projection } from '../utils'
import type { Generatable } from './Generatable'
import type { OutputType } from './Output'

export class PayloadType implements Generatable {
  constructor(protected readonly type: OutputType, protected readonly findMany = true) {}

  public toTS(): string {
    const { type } = this
    const { name } = type

    const argsName = getArgName(name, false)
    const payloadName = getPayloadName(name)

    const include = this.renderRelations(Projection.include)
    const select = this.renderRelations(Projection.select)

    const findManyArg = this.findMany ? ` | ${getModelArgName(name, DMMF.ModelAction.findMany)}` : ''

    return `\
export type ${payloadName}<
  S extends boolean | null | undefined | ${argsName},
  IsRelationalPayload extends boolean = false,
  > = S extends true
  ? ${name}
  : S extends undefined
  ? IsRelationalPayload extends true ? undefined : never
  : S extends ${argsName}${findManyArg}
  ? S extends { include: infer ProjectionFilter }
  ? ${name} ${include.length > 0 ? ` & ${include}` : ''}
  : S extends { select: infer ProjectionFilter }
  ? ProjectionFilter extends undefined | null
  ? IsRelationalPayload extends true
    ? undefined
    : ${name}
  : ${select}
  : ${name}
: S extends false ? undefined : ${name}
`
  }

  private renderRelations(projection: Projection): string {
    const { type } = this
    // TODO: can be optimized, we're calling the filter two times
    const relations = type.fields.filter((f) => f.outputType.location === 'outputObjectTypes')
    if (relations.length === 0 && projection === Projection.include) {
      return ''
    }
    const selectPrefix =
      projection === Projection.select
        ? ` P extends keyof ${type.name} ? ${type.name}[P] | (false extends ProjectionFilter[P] ? undefined : never) :`
        : ''

    return `{
  [P in TrueKeys<ProjectionFilter>]:
${indent(
  relations
    .map(
      (f) =>
        `P extends '${f.name}' ? ${this.wrapType(
          f,
          `${getPayloadName((f.outputType.type as DMMF.OutputType).name)}<ProjectionFilter[P], true>`,
        )} :`,
    )
    .join('\n'),
  6,
)} ${selectPrefix} never
  } `
  }

  private wrapType(field: DMMF.SchemaField, str: string): string {
    const { outputType } = field
    if (!field.isNullable && !outputType.isList) {
      return str
    }
    if (outputType.isList) {
      return `TruthyArray<${str}>`
    }
    if (str === 'Null') {
      return 'null'
    }
    if (field.isNullable) {
      str += ' | null'
    }
    return str
  }
}
