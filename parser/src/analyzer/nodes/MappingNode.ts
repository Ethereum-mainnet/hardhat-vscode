import { Mapping } from "@solidity-parser/parser/dist/ast-types";

import { Location, FinderType, Node } from "./Node";

export class MappingNode implements Node {
    type: string;
    uri: string;
    astNode: Mapping;

    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    typeNodes: Node[] = [];

    constructor (mapping: Mapping, uri: string) {
        this.type = mapping.type;
        this.uri = uri;
        this.astNode = mapping;
    }

    getTypeNodes(): Node[] {
        let nodes: Node[] = [];

        this.typeNodes.forEach(typeNode => {
            nodes = nodes.concat(typeNode.getTypeNodes());
        });

        return nodes;
    }

    getName(): string | undefined {
        return undefined;
    }

    addChild(child: Node): void {
        this.children.push(child);
    }

    setParent(parent: Node): void {
        this.parent = parent;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node): Node {
        find(this.astNode.keyType, this.uri).accept(find, orphanNodes, parent);
        const typeNode = find(this.astNode.valueType, this.uri).accept(find, orphanNodes, parent);

        this.typeNodes.push(typeNode);

        return this;
    }
}