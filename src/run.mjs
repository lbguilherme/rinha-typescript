import ts from "typescript";
import fs from "fs";

const file = "src/input.ts";

async function read(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

const raw = process.argv[2] ? fs.readFileSync(process.argv[2], "utf8") : await read(process.stdin);

fs.writeFileSync(file, `
import { ParseRinha } from "./parser";
import { ExecuteRinha } from "./executor";

type Ast = ParseRinha<${JSON.stringify(raw)}>;

export type Result = ExecuteRinha<Ast>;

export type Value = Result["value"];
export type StdOut = Result["stdout"];
`);

const program = ts.createProgram([file], {});
const checker = program.getTypeChecker();
const source = program.getSourceFiles().find(s => s.fileName === file);

const stdout = checker.getDeclaredTypeOfSymbol(source.locals.get("StdOut").exportSymbol);

process.stdout.write(stdout.value);

fs.rmSync(file);
