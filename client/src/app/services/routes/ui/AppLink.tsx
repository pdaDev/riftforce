import { FC, ReactNode } from "react";
import { Link } from "react-router-dom";
import { Callback } from "../namespace";
import tree  from "../model/routeTree"

const { paths } = tree

type Props = {
    children: ReactNode
    to: Callback<typeof paths>
} & Omit<Parameters<typeof Link>[0], 'to'>

export const AppLink: FC<Props> = ({ children, to, ...props }) => {
    return <Link {...props} to={to(paths).getKey()}>
        { children }
    </Link>
}

