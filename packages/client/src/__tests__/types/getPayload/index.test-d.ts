import { expectError, expectType } from 'tsd'

import { Post, Prisma, PrismaClient, User } from '.'
import { ExpectTrue, Equal as Equals, NotEqual, ExpectFalse } from '@type-challenges/utils'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:dev.db',
    },
  },
})
type Actual = Prisma.UserGetPayload<{
  select: {
    id: true
    posts: { select: { id: true } } | undefined
  }
}>
/**
 * Actual test cases for payload type inference.
 *
 * @remarks Values returned at runtime are treated as correct and expected.
 */

type FalsyProjection = [
  // @ts-expect-error type not allowed, but `false` is the same as `true` at runtime
  ExpectTrue<Equals<User, Prisma.UserGetPayload<{ select: false }>>>,
  // anything but `false` is the same as `true`
  ExpectTrue<Equals<User, Prisma.UserGetPayload<{}>>>,
  ExpectTrue<Equals<User, Prisma.UserGetPayload<undefined | true>>>,
  ExpectTrue<Equals<User, Prisma.UserGetPayload<{ select: undefined }>>>,
  ExpectTrue<Equals<User, Prisma.UserGetPayload<{ select: null }>>>,
]

type RequireAtLeastOneTruthyRelational = [
  ExpectTrue<
    Equals<
      {
        id: number
        posts: never
      },
      Prisma.UserGetPayload<{
        select: {
          id: true
          posts: {
            select: undefined
          }
        }
      }>
    >
  >,
  /**
   * expected assuming runtime behavior is intended
   *
   * @remarks Falsy values result in the full scalar payload being returned
   * @example
   * ```ts
   * {} | undefined | null | {select: undefined}
   * ```
   *
   * @remarks Same for some truthy values which are invalid inputs
   * @example
   * ```ts
   * "some random  string" | ""
   * ```
   */
  ExpectTrue<
    Equals<
      {
        id: number
        posts: Post[]
      },
      Prisma.UserGetPayload<{ select: { id: true; posts: { select: undefined } } }>
    >
  >,
  // @ts-expect-error require at least one truthy key
  Prisma.UserGetPayload<{ select: { posts: { select: null } } }>,
  // @ts-expect-error require at least one truthy key
  Prisma.UserGetPayload<{ select: { posts: null } }>,
]

type RequireAtLeastOneTruthy = [
  // @ts-expect-error require at least one truthy key
  Prisma.UserGetPayload<{ select: { id: false } }>,
  // @ts-expect-error empty select filter not allowed at runtime
  Prisma.UserGetPayload<{ select: {} }>,
]

type ConditionalSelect = [
  // should return an union of possible payloads
  ExpectTrue<
    Equals<
      { id: number; email: string | undefined },
      Prisma.UserGetPayload<{ select: { id: true; email: true | false } }>
    >
  >,
  ExpectTrue<Equals<User | { id: number }, Prisma.UserGetPayload<{ select: undefined | { id: true } }>>>,
  ExpectTrue<
    Equals<
      { id: number; posts: Post[] | undefined },
      Prisma.UserGetPayload<{ select: { id: true; posts: true | false } }>
    >
  >,
  ExpectTrue<
    Equals<
      { id: number; posts: Post[] | { id: string }[] | undefined },
      Prisma.UserGetPayload<{ select: { id: true; posts: true | { select: { id: true } } | false } }>
    >
  >,
]

type What = Prisma.UserGetPayload<{ select: { id: true; posts: true | { select: { id: true } } | false } }>

type FalsyRelationalSelect = [
  ExpectTrue<
    Equals<
      {
        id: number
      },
      Prisma.UserGetPayload<{ select: { id: true } }>
    >
  >,
  ExpectFalse<
    Equals<
      {
        id: number
        posts: Post[]
      },
      Prisma.UserGetPayload<{ select: { id: true; posts: { select: undefined } } }>
    >
  >,
  ExpectTrue<
    Equals<
      {
        id: number
        posts: never
      },
      Prisma.UserGetPayload<{ select: { id: true; posts: { select: undefined } } }>
    >
  >,
  // optional `posts` select filter
  ExpectFalse<
    Equals<
      {
        id: number
        posts: { id: number }[]
      },
      Prisma.UserGetPayload<{ select: { id: true; posts: { select: { id: true } } | undefined } }>
    >
  >,
  // expected assuming runtime behavior is intended
  ExpectTrue<
    Equals<
      {
        id: number
        posts: { id: number }[] | Post[]
      },
      Prisma.UserGetPayload<{ select: { id: true; posts: { select: { id: true } } | undefined } }>
    >
  >,
  // expected assuming the absence of `posts` should be the same as `posts: undefined`
  ExpectTrue<
    Equals<
      {
        id: number
        posts: { id: number }[] | undefined
      },
      Prisma.UserGetPayload<{ select: { id: true; posts: { select: { id: true } } | undefined } }>
    >
  >,
]

type FalseRelationalSelect = [
  // false -> `undefined`
  ExpectTrue<
    Equals<
      {
        id: number
        posts:
          | {
              id: number
            }[]
          | undefined
      },
      Prisma.UserGetPayload<{ select: { id: true; posts: { select: { id: true } } | false } }>
    >
  >,
]

type TestType = Prisma.UserGetPayload<{ select: { id: boolean } }>

// whatever this is
;(async () => {
  const validator = Prisma.validator<Prisma.UserSelect>()

  const b: boolean = 1 > 2 ? true : false
  const u = await prisma.user.findUnique({ where: { id: 1 }, select: { id: b } })
  expectType<User>(await prisma.user.findFirst({ select: undefined, rejectOnNotFound: true }))
  expectType<{ id: undefined | number }>({} as Prisma.UserGetPayload<{ select: { id: true | false; name: true } }>)
  expectType<{ id: undefined | number }>({} as Prisma.UserGetPayload<{ select: { id: true | false; name: true } }>)
})()
