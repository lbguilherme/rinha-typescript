
import { Add, GreaterThan, IsEqual, Not, And, Or, Subtract, Multiply } from "type-plus";

type Stringify<Value> =
  Value extends string ? Value :
  Value extends number | true | false ? `${Value}` :
  Value extends [infer First, infer Second] ? `(${Stringify<First>}, ${Stringify<Second>})` :
  Value extends { kind: string } ? `<unevaluated ast ${Value["kind"]}>` :
  Value extends { literal: "function" } ? `<#closure>` : "null";

type CallFunctionArgs<Vars extends Record<string, unknown>, Args, Exprs> =
  Args extends [infer FirstArgName extends string, ...infer RestArgsNames extends string[]]
  ? (
    Exprs extends [infer FirstExpr, ...infer RestExprs]
    ? (
      Execute<Vars, FirstExpr> extends { value: infer Value, stdout: infer StdoutExpr extends string }
      ? (
        CallFunctionArgs<Vars, RestArgsNames, RestExprs> extends { values: infer NextValues, stdout: infer NextStdout extends string }
        ? { values: { [key in FirstArgName]: Value } & NextValues, stdout: `${StdoutExpr}${NextStdout}` }
        : never
      )
      : never
    )
    : 2
  )
  : { values: {}, stdout: "" };

type MapFuncArgs<Args> =
        Args extends [{ text: infer First }, ...infer Rest extends { text: string }[]] ? [First, ...MapFuncArgs<Rest>] : [];

type ValueAsBoolean<Value> = Value extends null | false | undefined | 0 ? false : true;

export type Execute<Vars extends Record<string, unknown>, Ast> =
  Ast extends { kind: "Let", name: { text: string }, value: any, next: any }
  ? (
    Execute<Vars, Ast["value"]> extends { value: infer Value, stdout: infer Stdout extends string }
    ? (
      Execute<Omit<Vars, Ast["name"]["text"]> & { [key in Ast["name"]["text"]]: Value }, Ast["next"]> extends { value: infer ValueNext, stdout: infer StdoutNext extends string }
      ? { value: ValueNext, stdout: `${Stdout}${StdoutNext}` }
      : { error: Ast }
    )
    : { error: Ast }
  )
  : Ast extends { kind: "Function", parameters: { text: string }[], value: any }
  ? { value: { literal: "function", args: MapFuncArgs<Ast["parameters"]>, body: Ast["value"] }, stdout: "" }
  : Ast extends { kind: "Print", value: any }
  ? (
    Execute<Vars, Ast["value"]> extends { value: infer Value, stdout: infer Stdout extends string }
    ? { value: Value, stdout: `${Stdout}${Stringify<Value>}\n` }
    : { error: Ast }
  )
  : Ast extends { kind: "First", value: any }
  ? (
    Execute<Vars, Ast["value"]> extends { value: [infer Value, unknown], stdout: infer Stdout extends string }
    ? { value: Value, stdout: Stdout }
    : { error: Ast }
  )
  : Ast extends { kind: "Second", value: any }
  ? (
    Execute<Vars, Ast["value"]> extends { value: [unknown, infer Value], stdout: infer Stdout extends string }
    ? { value: Value, stdout: Stdout }
    : { error: Ast }
  )
  : Ast extends { kind: "Var", text: string }
  ? { value: Vars[Ast["text"]], stdout: `` }
  : Ast extends { kind: "Str", value: string }
  ? { value: Ast["value"], stdout: `` }
  : Ast extends { kind: "Int", value: number }
  ? { value: Ast["value"], stdout: `` }
  : Ast extends { kind: "Bool", value: boolean }
  ? { value: Ast["value"], stdout: `` }
  : Ast extends { kind: "Tuple", first: any, second: any }
  ? (
    Execute<Vars, Ast["first"]> extends { value: infer FirstValue, stdout: infer FirstStdout extends string }
    ? (
      Execute<Vars, Ast["second"]> extends { value: infer SecondValue, stdout: infer SecondStdout extends string }
      ? { value: [FirstValue, SecondValue], stdout: `${FirstStdout}${SecondStdout}` }
      : { error: Ast }
    )
    : { error: Ast }
  )
  : Ast extends { kind: "Call", callee: any, arguments: any[] }
  ? (
    Execute<Vars, Ast["callee"]> extends { value: { literal: "function", args: infer FuncArgs extends string[], body: infer FuncBody }, stdout: infer FuncStdout extends string }
    ? (
      CallFunctionArgs<Vars, FuncArgs, Ast["arguments"]> extends { values: infer ArgValues, stdout: infer ArgsStdout extends string }
      ? (
        Execute<Omit<Vars, FuncArgs[number]> & ArgValues, FuncBody> extends { value: infer ResultValue, stdout: infer ResultStdout extends string }
        ? { value: ResultValue, stdout: `${FuncStdout}${ArgsStdout}${ResultStdout}` }
        : { error: Ast }
      )
      : { error: Ast }
    )
    : { error: Ast }
  )
  : Ast extends { kind: "If", condition: any, then: any, otherwise: any }
  ? (
      Execute<Vars, Ast["condition"]> extends { value: infer CondValue, stdout: infer CondStdout extends string }
      ? (
        ValueAsBoolean<CondValue> extends true
        ? (
          Execute<Vars, Ast["then"]> extends { value: infer ResultValue, stdout: infer ResultStdout extends string }
          ? { value: ResultValue, stdout: `${CondStdout}${ResultStdout}` }
          : { error: Ast }
        )
        : (
          Execute<Vars, Ast["otherwise"]> extends { value: infer ResultValue, stdout: infer ResultStdout extends string }
          ? { value: ResultValue, stdout: `${CondStdout}${ResultStdout}` }
          : { error: Ast }
        )
      )
      : { error: Ast }
    )
  : Ast extends { kind: "Binary", lhs: any, op: infer Op extends string, rhs: any }
  ? (
    Execute<Vars, Ast["lhs"]> extends { value: infer Lhs, stdout: infer LhsStdout extends string }
    ? (
      Execute<Vars, Ast["rhs"]> extends { value: infer Rhs, stdout: infer RhsStdout extends string }
      ? (
        {
          value: Op extends "Lt" ? (
            (Lhs extends number
              ? Rhs extends number
                ? Not<Or<GreaterThan<Lhs, Rhs>, IsEqual<Lhs, Rhs>>>
                : "rhs must be number"
              : "lhs must be number")
          ) : Op extends "Gt" ? (
            (Lhs extends number
              ? Rhs extends number
                ? GreaterThan<Lhs, Rhs>
                : "rhs must be number"
              : "lhs must be number")
          ) : Op extends "Lte" ? (
            (Lhs extends number
              ? Rhs extends number
                ? Not<GreaterThan<Lhs, Rhs>>
                : "rhs must be number"
              : "lhs must be number")
          ) : Op extends "Gte" ? (
            (Lhs extends number
              ? Rhs extends number
                ? Or<GreaterThan<Lhs, Rhs>, IsEqual<Lhs, Rhs>>
                : "rhs must be number"
              : "lhs must be number")
          ) : Op extends "Sub" ? (
            (Lhs extends number
              ? Rhs extends number
                ? Subtract<Lhs, Rhs>
                : "rhs must be number"
              : "lhs must be number")
          ) : Op extends "Add" ? (
            (Lhs extends number
              ? Rhs extends number
                ? Add<Lhs, Rhs>
                : "rhs must be number"
              : "lhs must be number")
          ) : Op extends "Mul" ? (
            (Lhs extends number
              ? Rhs extends number
                ? Multiply<Lhs, Rhs>
                : "rhs must be number"
              : "lhs must be number")
          ) : Op extends "Or" ? (
            Or<ValueAsBoolean<Lhs>, ValueAsBoolean<Rhs>>
          ) : Op extends "And" ? (
            And<ValueAsBoolean<Lhs>, ValueAsBoolean<Rhs>>
          ) : Op extends "Eq" ? (
            IsEqual<Lhs, Rhs>
          ) : Op extends "Neq" ? (
            Not<IsEqual<Lhs, Rhs>>
          ) : `❌ unknown op ${Op}`,
          stdout: `${LhsStdout}${RhsStdout}`
        }
      )
      : { error: Ast }
    )
    : { error: Ast }
  )
  : { value: Ast, stdout: "" };

export type ExecuteRinha<Ast extends { expression: any }> = Execute<{}, Ast["expression"]>;
