import { ReactNode } from "react"
import { PermissionType } from "../../../shared/lib/types"

export const keyParam = '_key_' as const
export const pathParam = '__path__' as const

export type TreeWithoutPathFields<T extends object> = 
{
     [P in Exclude<keyof T, typeof pathParam | 'getKey'>]:
        P extends typeof keyParam 
            ? (key?: string | number) => T[P] extends object
                ? TreeWithoutPathFields<T[P]>
                : T[P]
            : T[P] extends object
                ? TreeWithoutPathFields<T[P]> 
                : T[P]
}

// T extends Readonly<{ [key: string]: object & { [pathParam]?: string } | null; }>


export type WithComponentNode = {
    component: ReactNode
}

export type FlatTreeNode = {
    [pathParam]?: string
    permission?: PermissionType 
    lazy?: boolean
} 
 


export type RamifiedTreeNode = {
    [key: string]: TreeNode | ReactNode
} & FlatTreeNode & Partial<WithComponentNode>

export type TreeNodeWithKeyParam = FlatTreeNode & Partial<WithComponentNode> &  {
    [keyParam]: TreeNodeWithCompulsoryPath
}

export type TreeNode = RamifiedTreeNode | TreeNodeWithKeyParam | (FlatTreeNode & WithComponentNode)

export type TreeNodeWithCompulsoryPath = Omit<TreeNode, typeof pathParam> & {
    [pathParam]: string
} 

type ObjectWithGetKey = { getKey: () => string }
type NestedObjectKey<T> = T extends TreeNode 
    ? ObjectWithGetKey & ObjectTree<T>
    : ObjectWithGetKey

export type ObjectTree<T extends object> =
     { [P in Exclude<keyof T,typeof pathParam | 'permission' | 'component'>]: P extends typeof keyParam
        ? (key?: string | number) => NestedObjectKey<T[P]>
        : NestedObjectKey<T[P]>
    }

export type MutableTree = Record<string, TreeNode | ReactNode>
export type Tree = Readonly<MutableTree>

export type Callback<T extends object> = (tree: TreeWithoutPathFields<T>, args?: Array<string | number>) => any