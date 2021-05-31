import * as fs from "fs";
import * as path from "path";
import * as parser from "@solidity-parser/parser";
import { ASTNode } from "@solidity-parser/parser/dist/src/ast-types";

import { Node, DocumentsAnalyzerTree } from "./nodes/Node";
import * as matcher from "./matcher";

export class Analyzer {
    documentsAnalyzer: { [uri: string]: DocumentAnalyzer } = {};
    documentsAnalyzerTree: DocumentsAnalyzerTree = {};

    constructor (rootPath: string | undefined) {
        const documentsUri: string[] = [];

        this.findSolFiles(rootPath, documentsUri);

        // Init all documentAnalyzers
        for (const documentUri of documentsUri) {
            if (!this.documentsAnalyzer[documentUri]) {
                this.documentsAnalyzer[documentUri] = new DocumentAnalyzer(documentUri);
                this.documentsAnalyzerTree[documentUri] = this.documentsAnalyzer[documentUri].analyze(this.documentsAnalyzerTree);
            }
        }
    }

    public analyzeDocument(document: string, uri: string): Node | undefined {
        if (uri.indexOf('file://') !== -1) {
            uri = uri.replace("file://", "");
        }

        if (this.documentsAnalyzer[uri]) {
            this.documentsAnalyzerTree[uri] = this.documentsAnalyzer[uri].analyze(this.documentsAnalyzerTree, document);
            return this.documentsAnalyzerTree[uri];
        }

        this.documentsAnalyzer[uri] = new DocumentAnalyzer(uri);
        this.documentsAnalyzerTree[uri] = this.documentsAnalyzer[uri].analyze(this.documentsAnalyzerTree, document);

        return this.documentsAnalyzerTree[uri];
    }

    private findSolFiles(base: string | undefined, documentsUri: string[]): void {
        if (!base) {
            return;
        }

        if (base.indexOf('file://') !== -1) {
            base = base.replace("file://", "");
        }

        try {
            const files = fs.readdirSync(base);

            files.forEach(file => {
                const newBase = path.join(base || "", file);

                if (fs.statSync(newBase).isDirectory()) {
                    this.findSolFiles(newBase, documentsUri);
                } else if (newBase.slice(-4) === ".sol") {
                    documentsUri.push(newBase);
                }
            });
        } catch (err) {
            console.error('Unable to scan directory: ' + err);
        }
    }
}

class DocumentAnalyzer {
    document: string | undefined;
    uri: string;

    ast: ASTNode | undefined;

    analyzerTree?: Node;

    orphanNodes: Node[] = [];

    constructor (uri: string) {
        this.uri = uri;
        this.document = "" + fs.readFileSync(uri);
    }

    public analyze(documentsAnalyzerTree: DocumentsAnalyzerTree, document?: string): Node | undefined {
        try {
            this.orphanNodes = [];

            if (document) {
                this.document = document;
            }

            this.ast = parser.parse(this.document || "", {
                loc: true,
                range: true,
                tolerant: true
            });

            // console.log(this.uri); //, JSON.stringify(this.ast));

            this.analyzerTree = matcher.find(this.ast, this.uri).accept(matcher.find, documentsAnalyzerTree, this.orphanNodes);

            return this.analyzerTree;
        } catch (err) {
            console.error(err);
        }
    }
}
