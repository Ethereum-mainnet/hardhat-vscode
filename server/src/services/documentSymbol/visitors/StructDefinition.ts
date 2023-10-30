import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind } from "@nomicfoundation/slang/kinds";
import { DefinitionVisitor } from "./DefinitionVisitor";

export class StructDefinition extends DefinitionVisitor {
  public ruleKind = RuleKind.StructDefinition;
  public symbolKind = SymbolKind.Struct;
}