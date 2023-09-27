import type { Parse } from "./parser_utils";

declare const lang: unique symbol;

declare module "./parser_utils" {
  interface Grammar {
    [lang]: {
      root: Rule<"file">;

      semicolon: [";", Repeat<[Rule<"ws">, ";"]>, Rule<"ws">];

      file: [Rule<"value">, Optional<Rule<"semicolon">>];
      expr: [
        Rule<"ws">,
        Or<[
          Rule<"int">,
          Rule<"string">,
          Rule<"let">,
          Rule<"fn">,
          Rule<"bool">,
          Rule<"tuple">,
          Rule<"if">,
          Rule<"var">,
          Rule<"parens">
        ]>,
        Rule<"ws">,
      ];

      ws: Repeat<Or<["\x20", "\x0A", "\x0D", "\x09"]>>;

      nonZeroDigit: "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
      digit: "0" | Rule<"nonZeroDigit">;
      int: RawToken<"0" | [Optional<"-">, Rule<"nonZeroDigit">, Repeat<Rule<"digit">>]>;

      parens: ["(", Rule<"value">, ")"];
      mul_expr: [Rule<"call_expr">, Repeat<["*" | "/" | "%", Rule<"call_expr">]>];
      add_expr: [Rule<"mul_expr">, Repeat<["+" | "-", Rule<"mul_expr">]>];
      comp_expr: [Rule<"add_expr">, Repeat<[Or<[">=", "<=", ">", "<"]>, Rule<"add_expr">]>];
      eq_expr: [Rule<"comp_expr">, Repeat<[Or<["==", "!="]>, Rule<"comp_expr">]>];
      and_expr: [Rule<"eq_expr">, Repeat<["&&", Rule<"eq_expr">]>];
      or_expr: [Rule<"and_expr">, Repeat<["||", Rule<"and_expr">]>];
      value: Rule<"or_expr">;

      characters: Repeat<Or<[AnyCharExcept<ControlChars | '"' | "\\">, Rule<"escape">]>>;
      escape: ["\\", Or<['"', "\\", "/", "b", "f", "n", "r", "t"]>];
      string: ['"', Rule<"characters">, '"'];

      ident: [Rule<"ws">, Not<"fn" | "let" | "if" | "true" | "false">, RawToken<[Char<"_" | Letters>, Repeat<Char<"_" | Letters | Numbers>>]>, Rule<"ws">];
      var: Rule<"ident">,

      let: ["let", Rule<"ident">, "=", Rule<"value">, Rule<"semicolon">, Rule<"value">];
      fnOtherArgs: [",", Rule<"ident">],
      fn: ["fn", Rule<"ws">, "(", Optional<[Rule<"ident">, Repeat<Rule<"fnOtherArgs">>]>, ")", Rule<"ws">, "=>", Rule<"ws">, "{", Rule<"value">, Optional<Rule<"semicolon">>, "}"];
      if: ["if", Rule<"ws">, "(", Rule<"value">, ")", Rule<"ws">, "{", Rule<"value">, Optional<Rule<"semicolon">>, "}", Rule<"ws">, "else", Rule<"ws">, "{", Rule<"value">, Optional<Rule<"semicolon">>, "}"]
      callOtherArgs: [",", Rule<"value">],
      callArgs: [Rule<"ws">, "(", Optional<[Rule<"value">, Repeat<Rule<"callOtherArgs">>]>, ")", Rule<"ws">],
      call_expr: [Rule<"expr">, Repeat<Rule<"callArgs">>];
      bool: "true" | "false";

      tuple: ["(", Rule<"value">, ",", Rule<"value">, ")"];
    };
  }

  interface Mapping<T> {
    [lang]: {
      file: T extends [infer Expr, unknown] ? { expression: Expr } : T;

      int: T extends string ? { kind: "Int", value: ParseInt<T> } : T;

      parens: T extends [unknown, infer Value, unknown] ? Value : T;
      mul_expr: T extends [infer First, infer Rest] ? CombineLeftOperators<First, Rest> : T;
      add_expr: T extends [infer First, infer Rest] ? CombineLeftOperators<First, Rest> : T;
      comp_expr: T extends [infer First, infer Rest] ? CombineLeftOperators<First, Rest> : T;
      eq_expr: T extends [infer First, infer Rest] ? CombineLeftOperators<First, Rest> : T;
      and_expr: T extends [infer First, infer Rest] ? CombineLeftOperators<First, Rest> : T;
      or_expr: T extends [infer First, infer Rest] ? CombineLeftOperators<First, Rest> : T;
      logic: T extends [infer First, infer Rest] ? CombineLeftOperators<First, Rest> : T;

      expr: T extends [unknown, infer Value, unknown] ? Value : T;
      ident: T extends [unknown, null, infer Value, unknown] ? Value : T;

      string: T extends [unknown, infer Contents, unknown] ? { kind: "Str", value: Contents } : T;
      characters: T extends string[] ? Concat<T> : never;
      escape: T extends ["\\", '"']
        ? '"'
        : T extends ["\\", "\\"]
        ? "\\"
        : T extends ["\\", "b"]
        ? "\b"
        : T extends ["\\", "f"]
        ? "\f"
        : T extends ["\\", "n"]
        ? "\n"
        : T extends ["\\", "r"]
        ? "\r"
        : T extends ["\\", "t"]
        ? "\t"
        : never;

      let: T extends [unknown, infer Var, unknown, infer Value, unknown, infer Next] ?
        { kind: "Let", name: { text: Var }, value: Value, next: Next } :
        T;
      var: { kind: "Var", text: T };

      callOtherArgs: T extends [unknown, infer Value] ? Value : T;
      callArgs: T extends [unknown, unknown, null, unknown, unknown] ? [] : T extends [unknown, unknown, [infer FirstArg, infer Rest extends any[]], unknown, unknown] ? [FirstArg, ...Rest] : T,

      call_expr: (T extends [infer Callee, infer MultiArgs] ? CombineCalls<Callee, MultiArgs> : T) extends infer Call ?
          Call extends { callee: { kind: "Var", text: "print" }, arguments: [infer Value] } ? {
            kind: "Print",
            value: Value
          } :
          Call extends { callee: { kind: "Var", text: "first" }, arguments: [infer Value] } ? {
            kind: "First",
            value: Value
          } :
          Call extends { callee: { kind: "Var", text: "second" }, arguments: [infer Value] } ? {
            kind: "Second",
            value: Value
          } :
          Call
        : T

      fnOtherArgs: T extends [unknown, infer Value] ? Value : T;

      fn: T extends [unknown, unknown, unknown, null, unknown, unknown, unknown, unknown, unknown, infer Body, unknown, unknown] ? {
        kind: "Function",
        parameters: [],
        value: Body
      } : T extends [unknown, unknown, unknown, [infer FirstArg extends string, infer Rest extends any[]], unknown, unknown, unknown, unknown, unknown, infer Body, unknown, unknown] ? {
        kind: "Function",
        parameters: WrapText<[FirstArg, ...Rest]>,
        value: Body
      } : T;
      if: T extends [unknown, unknown, unknown, infer Cond, unknown, unknown, unknown, infer TrueValue, unknown, unknown, unknown, unknown, unknown, unknown, infer ElseValue, unknown, unknown] ? {
        kind: "If",
        condition: Cond,
        then: TrueValue,
        otherwise: ElseValue
      } : T;

      bool: T extends "true" ? { kind: "Bool", value: true } : T extends "false" ? { kind: "Bool", value: false } : T;
      tuple: T extends [unknown, infer First, unknown, infer Second, unknown] ? {
        kind: "Tuple",
        first: First,
        second: Second
      } : T;
    };
  }
}

export type ParseRinha<Input extends string> = Parse<typeof lang, Input>;

type BinaryOp = {
  "+": "Add",
  "-": "Sub",
  "*": "Mul",
  "/": "Div",
  "%": "Mod",
  "==": "Eq",
  "!=": "Neq",
  ">": "Gt",
  "<": "Lt",
  ">=": "Gte",
  "<=": "Lte",
  "&&": "And",
  "||": "Or",
}

type WrapText<A extends string[]> = A extends [infer First, ...infer Rest extends string[]] ? [{ text: First }, ...WrapText<Rest>] : [];

type CombineLeftOperators<Left, Rest> = Rest extends [[infer Op extends keyof BinaryOp, infer Right], ...infer Next]
  ? CombineLeftOperators<{ kind: "Binary", lhs: Left; op: BinaryOp[Op]; rhs: Right }, Next>
  : Left;

type CombineCalls<Callee, MultiArgs> = MultiArgs extends [] ? Callee :
  MultiArgs extends [infer Args, ...infer NextCallArgs] ? CombineCalls<{
    kind: "Call",
    callee: Callee,
    arguments: Args
  }, NextCallArgs> : never;

type Concat<Strs extends string[]> = Strs extends [infer First extends string, ...infer Rest extends string[]]
  ? `${First}${Concat<Rest>}`
  : "";

type ParseInt<T> = T extends `${infer N extends number | bigint}` ? (number | bigint extends N ? T : N) : never;

type ControlChars =
  | "\x01"
  | "\x02"
  | "\x03"
  | "\x04"
  | "\x05"
  | "\x06"
  | "\x07"
  | "\x08"
  | "\x09"
  | "\x0A"
  | "\x0B"
  | "\x0C"
  | "\x0D"
  | "\x0E"
  | "\x0F"
  | "\x11"
  | "\x12"
  | "\x13"
  | "\x14"
  | "\x15"
  | "\x16"
  | "\x17"
  | "\x18"
  | "\x19"
  | "\x1A"
  | "\x1B"
  | "\x1C"
  | "\x1D"
  | "\x1E"
  | "\x1F";

  type Numbers = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";

  type LowercaseLetters =
  | "a"
  | "b"
  | "c"
  | "d"
  | "e"
  | "f"
  | "g"
  | "h"
  | "i"
  | "j"
  | "k"
  | "l"
  | "m"
  | "n"
  | "o"
  | "p"
  | "q"
  | "r"
  | "s"
  | "t"
  | "u"
  | "v"
  | "w"
  | "x"
  | "y"
  | "z";

  type Letters = LowercaseLetters | Uppercase<LowercaseLetters>;
