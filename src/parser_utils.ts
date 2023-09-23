export interface Grammar {
  x: {};
}

// eslint-disable-next-line unused-imports/no-unused-vars-ts
export interface Mapping<T> {}

type Join<Strs, Separator extends string> = Strs extends [
  infer First extends string,
  infer Second extends string,
  ...infer Rest extends string[],
]
  ? `${First}${Separator}${Join<[Second, ...Rest], Separator>}`
  : Strs extends [infer First extends string]
  ? First
  : "";

export type RuleDef =
  | string
  | Repeat<RuleDef>
  | Rule<string>
  | Or<RuleDef[]>
  | RuleDef[]
  | Optional<RuleDef>
  | RawToken<RuleDef>
  | AnyCharExcept<string>
  | Char
  | Not<RuleDef>
  | CaseInsensitive<string>;

export interface Repeat<Action extends RuleDef> {
  $repeat: Action;
}

export interface Rule<Name extends string> {
  $rule: Name;
}

export interface Or<Actions extends RuleDef[]> {
  $or: Actions;
}

export interface Optional<Action extends RuleDef> {
  $optional: Action;
}

export interface RawToken<Action extends RuleDef> {
  $rawToken: Action;
}

export interface AnyCharExcept<Chars extends string> {
  $anyCharExcept: Chars;
}

export interface Char<ValidChars extends string = string> {
  $char: ValidChars;
}

export interface Not<Action extends RuleDef> {
  $not: Action;
}

export interface CaseInsensitive<Text extends string> {
  $caseInsensitive: Text;
}

type ParseOrOperatorInternal<
  Lang extends keyof Grammar,
  Input extends string,
  FirstResult,
  Rest extends RuleDef[],
  Errors extends string[] = [],
> = FirstResult extends {
  $error: string;
}
  ? ParseOrOperator<Lang, Input, Rest, [...Errors, FirstResult["$error"]]>
  : FirstResult;

type ParseOrOperator<
  Lang extends keyof Grammar,
  Input extends string,
  Options extends RuleDef[],
  Errors extends string[] = [],
> = Options extends [infer First extends RuleDef, ...infer Rest extends RuleDef[]]
  ? ParseOrOperatorInternal<Lang, Input, ParsePartial<Lang, Input, First>, Rest, Errors>
  : { $error: `Neither option matched: (${Join<Errors, ") and (">})` };

type ParseSeqOperatorSingleRule<ParseResult> = ParseResult extends {
  $error: string;
}
  ? ParseResult
  : ParseResult extends {
      value: infer Value;
      parsed: infer Parsed;
      tail: infer Tail;
    }
  ? { value: [Value]; parsed: Parsed; tail: Tail }
  : { $error: "Bug: invalid intermediary result" };

type ParseSeqOperatorMultipleRule<
  Lang extends keyof Grammar,
  FirstResult,
  Sequence extends RuleDef[],
> = FirstResult extends {
  $error: string;
}
  ? FirstResult
  : FirstResult extends { tail: infer Tail extends string }
  ? ParseSeqOperatorMultipleRuleInner<FirstResult, ParseSeqOperator<Lang, Tail, Sequence>>
  : { $error: "Bug: invalid intermediary result" };

type ParseSeqOperatorMultipleRuleInner<FirstResult, RestResult> = FirstResult extends {
  $error: string;
}
  ? FirstResult
  : FirstResult extends {
      value: infer FirstValue;
      parsed: infer FirstParsed extends string;
    }
  ? RestResult extends {
      $error: string;
    }
    ? RestResult
    : RestResult extends {
        value: infer RestValue extends unknown[];
        parsed: infer RestParsed extends string;
        tail: infer RestTail;
      }
    ? {
        value: [FirstValue, ...RestValue];
        parsed: `${FirstParsed}${RestParsed}`;
        tail: RestTail;
      }
    : { $error: "Bug: invalid intermediary result" }
  : { $error: "Bug: invalid intermediary result" };

type ParseSeqOperator<Lang extends keyof Grammar, Input extends string, Sequence extends RuleDef[]> = Sequence extends [
  infer FirstRule extends RuleDef,
  infer SecondRule extends RuleDef,
  ...infer NextRules extends RuleDef[],
]
  ? ParseSeqOperatorMultipleRule<Lang, ParsePartial<Lang, Input, FirstRule>, [SecondRule, ...NextRules]>
  : Sequence extends [infer FirstRule extends RuleDef]
  ? ParseSeqOperatorSingleRule<ParsePartial<Lang, Input, FirstRule>>
  : { $error: "Bug: invalid intermediary result" };

type ParseOptionalOperator<Input, ParseResult> = ParseResult extends {
  $error: string;
}
  ? { value: null; parsed: ""; tail: Input }
  : ParseResult;

type ParseRepeatOperator<
  Lang extends keyof Grammar,
  Input extends string,
  FirstResult,
  RepeatRule extends RuleDef,
> = FirstResult extends {
  $error: string;
}
  ? { value: []; parsed: ""; tail: Input }
  : FirstResult extends { tail: infer Tail extends string }
  ? ParseRepeatOperatorMultipleRuleInner<FirstResult, ParsePartial<Lang, Tail, Repeat<RepeatRule>>>
  : { $error: "Bug: invalid intermediary result" };

type ParseRepeatOperatorMultipleRuleInner<FirstResult, RestResult> = FirstResult extends {
  $error: string;
}
  ? FirstResult
  : FirstResult extends {
      value: infer FirstValue;
      parsed: infer FirstParsed extends string;
    }
  ? RestResult extends {
      $error: string;
    }
    ? FirstResult
    : RestResult extends {
        value: infer RestValue extends unknown[];
        parsed: infer RestParsed extends string;
        tail: infer RestTail;
      }
    ? {
        value: [FirstValue, ...RestValue];
        parsed: `${FirstParsed}${RestParsed}`;
        tail: RestTail;
      }
    : { $error: "Bug: invalid intermediary result" }
  : { $error: "Bug: invalid intermediary result" };

type TransformRule<Lang extends keyof Grammar, ParseResult, RuleName extends string> = ParseResult extends {
  value: infer Value;
  parsed: infer Parsed;
  tail: infer Tail;
}
  ? Lang extends keyof Mapping<Value>
    ? RuleName extends keyof Mapping<Value>[Lang]
      ? { value: Mapping<Value>[Lang][RuleName]; parsed: Parsed; tail: Tail }
      : ParseResult
    : ParseResult
  : ParseResult;

type ReplaceRawTokenResult<ParseResult> = ParseResult extends {
  parsed: infer Parsed;
  tail: infer Tail;
}
  ? { value: Parsed; parsed: Parsed; tail: Tail }
  : ParseResult;

type CaseInsensitiveMatch<
  Parsed extends string,
  Input extends string,
  Goal extends string,
> = Goal extends `${infer GoalFirst}${infer GoalTail}`
  ? Input extends `${infer InputFirst}${infer InputTail}`
    ? Lowercase<GoalFirst> extends Lowercase<InputFirst>
      ? CaseInsensitiveMatch<InputFirst, InputTail, GoalTail>
      : { $error: `Expected '${Goal}' but got '${Input}'` }
    : { $error: `Expected '${Goal}' at end of input` }
  : { value: Parsed; parsed: Parsed; tail: Input };

type ParsePartial<
  Lang extends keyof Grammar,
  Input extends string,
  R extends RuleDef = Rule<"root">,
> = HandleParseUnion<ParsePartialInternal<Lang, Input, R>>;

type ParseNot<ParseResult, Input extends string> = ParseResult extends { $error: string }
  ? { value: null; parsed: ""; tail: Input }
  : { $error: `Invalid sequence at ${Input}` };

type ParsePartialInternal<
  Lang extends keyof Grammar,
  Input extends string,
  R extends RuleDef = Rule<"root">,
> = R extends string
  ? Input extends `${R}${infer Tail}`
    ? { value: R; parsed: R; tail: Tail }
    : { $error: `'${Input}' does not start with '${R}'` }
  : R extends Rule<infer Name>
  ? Name extends keyof Grammar[Lang]
    ? Grammar[Lang][Name] extends RuleDef
      ? TransformRule<Lang, ParsePartial<Lang, Input, Grammar[Lang][Name]>, Name>
      : { $error: `Rule '${Name}' is not a valid rule` }
    : { $error: `Rule '${Name}' does not exist in the grammar` }
  : R extends Or<infer Options>
  ? ParseOrOperator<Lang, Input, Options>
  : R extends RuleDef[]
  ? ParseSeqOperator<Lang, Input, R>
  : R extends Optional<infer InnerRule>
  ? ParseOptionalOperator<Input, ParsePartial<Lang, Input, InnerRule>>
  : R extends RawToken<infer InnerRule>
  ? ReplaceRawTokenResult<ParsePartial<Lang, Input, InnerRule>>
  : R extends Not<infer InnerRule>
  ? ParseNot<ParsePartial<Lang, Input, InnerRule>, Input>
  : R extends Repeat<infer InnerRule>
  ? ParseRepeatOperator<Lang, Input, ParsePartial<Lang, Input, InnerRule>, InnerRule>
  : R extends CaseInsensitive<infer Goal>
  ? CaseInsensitiveMatch<"", Input, Goal>
  : R extends AnyCharExcept<infer Except>
  ? Input extends `${infer First}${infer Tail}`
    ? First extends Except
      ? { $error: `'${Input}' should not start with '${First}'` }
      : { value: First; parsed: First; tail: Tail }
    : { $error: `'${Input}' should have at least one char` }
  : R extends Char<infer ValidChars>
  ? Input extends `${infer First}${infer Tail}`
    ? First extends ValidChars
      ? { value: First; parsed: First; tail: Tail }
      : { $error: `'${Input}' should not start with '${First}'` }
    : { $error: `'${Input}' should have at least one char` }
  : { $error: `Invalid rule construction` };

type IsUnion<T, U extends T = T> = (T extends T ? (U extends T ? false : true) : never) extends false ? false : true;

type RemoveErrorsFromUnion<ParseResult> = ParseResult extends {
  $error: string;
}
  ? never
  : ParseResult;

type HandleParseUnion<ParseResult> = IsUnion<ParseResult> extends true
  ? [ParseResult] extends [{ $error: string }]
    ? { $error: `Neither option matched: (${Join<TuplifyUnion<ParseResult["$error"]>, ") and (">})` }
    : IsUnion<RemoveErrorsFromUnion<ParseResult>> extends true
    ? { $error: "Ambigous parse" }
    : RemoveErrorsFromUnion<ParseResult>
  : ParseResult;

type CheckEmptyTail<ParseResult> = ParseResult extends {
  value: infer Value;
  tail: infer Tail extends string;
}
  ? "" extends Tail
    ? Value
    : { $error: `Expected end of string, but found '${Tail}'` }
  : ParseResult;

type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
type LastOf<T> = UnionToIntersection<T extends unknown ? () => T : never> extends () => infer R ? R : never;

type TuplifyUnion<T, L = LastOf<T>, N = [T] extends [never] ? true : false> = true extends N
  ? []
  : [...TuplifyUnion<Exclude<T, L>>, L];

export type Parse<Lang extends keyof Grammar, Input extends string, R extends RuleDef = Rule<"root">> = CheckEmptyTail<
  ParsePartial<Lang, Input, R>
>;
