import { DetailedHTMLProps, FC, HTMLAttributes, ReactNode } from "react"
import { LabelVariant } from ".."
import { Skeleton } from "@mui/material"

interface IProps
    extends DetailedHTMLProps<
        HTMLAttributes<HTMLHeadingElement>,
        HTMLHeadingElement
    > {
    variant: LabelVariant
    value?: string | number | null
    className?: string
    loading?: boolean
    loadingClassName?: string
    children?: ReactNode
}

export const Label: FC<IProps> = ({
    variant,
    value,
    loading,
    className,
    loadingClassName,
    children,
    ...props
}) => {
    const isLoading = loading || (!value && !children)

    if (isLoading) {
        return <Skeleton variant={"rounded"} className={loadingClassName} />
    }

    const getClassName = (styles: string) => {
        return `${styles} ${className}`
    }

    const label = children || value

    switch (variant) {
        case "h1":
            return (
                <h1 className={getClassName("text-3xl font-bold")} {...props}>
                    {label}
                </h1>
            )
        case "h2":
            return (
                <h2
                    className={getClassName("ml-3 font-semibold text-xl")}
                    {...props}>
                    {label}
                </h2>
            )
        case "h3":
            return (
                <h3 className={getClassName("font-semibold")} {...props}>
                    {label}
                </h3>
            )
        case "h4":
            return (
                <h4 className={getClassName("")} {...props}>
                    {label}
                </h4>
            )
        case "h5":
            return (
                <h5 className={getClassName("")} {...props}>
                    {label}
                </h5>
            )
        case "h6":
            return (
                <h6 className={getClassName("")} {...props}>
                    {label}
                </h6>
            )
        default:
            return null
    }
}
