import { ParseRinha } from "./src/parser";
import { ExecuteRinha } from "./src/executor";

type Ast = ParseRinha<`

let fib = fn (n) => {
  if (n < 2) {
    n
  } else {
    fib(n - 1) + fib(n - 2)
  }
};

print(fib(10))

`>;

export type Result = ExecuteRinha<Ast>;
