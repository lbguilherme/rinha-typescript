import type { Parse } from "./parser_utils";

declare const lang: unique symbol;

declare module "./parser_utils" {
  interface Grammar {
    [lang]: {
      root: Rule<"file">;

      semicolon: [";", Repeat<[Rule<"ws">, ";"]>, Rule<"ws">];

      file: [Rule<"value">, Optional<Rule<"semicolon">>];
      term: [
        Rule<"ws">,
        Or<[
          Rule<"int">,
          Rule<"string">,
          Rule<"parens">,
          Rule<"let">,
          Rule<"fn">,
          Rule<"bool">,
          Rule<"tuple">,
          Rule<"if">,
          Rule<"call">,
          Rule<"var">
        ]>,
        Rule<"ws">,
      ];

      ws: Repeat<Or<["\x20", "\x0A", "\x0D", "\x09"]>>;

      nonZeroDigit: "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
      digit: "0" | Rule<"nonZeroDigit">;
      int: RawToken<"0" | [Optional<"-">, Rule<"nonZeroDigit">, Repeat<Rule<"digit">>]>;

      parens: ["(", Rule<"value">, ")"];
      factor: [Rule<"term">, Repeat<["*" | "/" | "%", Rule<"term">]>];
      arithmetic: [Rule<"factor">, Repeat<["+" | "-", Rule<"factor">]>];
      logic: [Rule<"arithmetic">, Repeat<["==" | "!=" | ">" | "<" | ">=" | "<=" | "&&" | "||", Rule<"arithmetic">]>];
      value: Rule<"logic">;

      characters: Repeat<Or<[AnyCharExcept<ControlChars | '"' | "\\">, Rule<"escape">]>>;
      escape: ["\\", Or<['"', "\\", "/", "b", "f", "n", "r", "t"]>];
      string: ['"', Rule<"characters">, '"'];

      ident: [Rule<"ws">, RawToken<[Char<"_" | Letters>, Repeat<Char<"_" | Letters | Numbers>>]>, Rule<"ws">];
      var: Rule<"ident">,

      let: ["let", Rule<"ident">, "=", Rule<"value">, Rule<"semicolon">, Rule<"value">];
      fnOtherArgs: [",", Rule<"ident">],
      fn: ["fn", Rule<"ws">, "(", Optional<[Rule<"ident">, Repeat<Rule<"fnOtherArgs">>]>, ")", Rule<"ws">, "=>", Rule<"ws">, "{", Rule<"value">, Optional<Rule<"semicolon">>, "}"];
      if: ["if", Rule<"ws">, "(", Rule<"value">, ")", Rule<"ws">, "{", Rule<"value">, Optional<Rule<"semicolon">>, "}", Rule<"ws">, "else", Rule<"ws">, "{", Rule<"value">, Optional<Rule<"semicolon">>, "}"]
      callOtherArgs: [",", Rule<"value">],
      call: [Rule<"var">, "(", Optional<[Rule<"value">, Repeat<Rule<"callOtherArgs">>]>, ")"];
      bool: "true" | "false";

      tuple: ["(", Rule<"value">, ",", Rule<"value">, ")"];
    };
  }

  interface Mapping<T> {
    [lang]: {
      file: T extends [infer Expr, unknown] ? { expression: Expr } : T;

      int: T extends string ? { kind: "Int", value: ParseInt<T> } : T;

      parens: T extends [unknown, infer Value, unknown] ? Value : T;
      factor: T extends [infer First, infer Rest] ? CombineLeftOperators<First, Rest> : T;
      arithmetic: T extends [infer First, infer Rest] ? CombineLeftOperators<First, Rest> : T;
      logic: T extends [infer First, infer Rest] ? CombineLeftOperators<First, Rest> : T;

      term: T extends [unknown, infer Value, unknown] ? Value : T;
      ident: T extends [unknown, infer Value, unknown] ? Value : T;

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
      call: T extends [{ kind: "Var", text: "print" }, unknown, [infer FirstArg, []], unknown] ? {
        kind: "Print",
        value: FirstArg
      } : T extends [{ kind: "Var", text: "first" }, unknown, [infer FirstArg, []], unknown] ? {
        kind: "First",
        value: FirstArg
      } : T extends [{ kind: "Var", text: "second" }, unknown, [infer FirstArg, []], unknown] ? {
        kind: "Second",
        value: FirstArg
      } : T extends [infer Callee, unknown, null, unknown] ? {
        kind: "Call",
        callee: Callee,
        arguments: []
      } : T extends [infer Callee, unknown, [infer FirstArg, infer Rest extends any[]], unknown] ? {
        kind: "Call",
        callee: Callee,
        arguments: [FirstArg, ...Rest]
      } : T

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

type Concat<Strs extends string[]> = Strs extends [infer First extends string, ...infer Rest extends string[]]
  ? `${First}${Concat<Rest>}`
  : "";

type ParseInt<T> = T extends `${infer N extends number}` ? (number extends N ? T : N) : never;

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

  type Letters =
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
    | "z"
    | "A"
    | "B"
    | "C"
    | "D"
    | "E"
    | "F"
    | "G"
    | "H"
    | "I"
    | "J"
    | "K"
    | "L"
    | "M"
    | "N"
    | "O"
    | "P"
    | "Q"
    | "R"
    | "S"
    | "T"
    | "U"
    | "V"
    | "W"
    | "X"
    | "Y"
    | "Z";
