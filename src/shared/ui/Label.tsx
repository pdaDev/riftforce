import { DetailedHTMLProps, FC, HTMLAttributes } from "react";
import { LabelVariant } from "..";
import { Skeleton } from "@mui/material";

interface IProps extends DetailedHTMLProps<HTMLAttributes<HTMLHeadingElement> ,HTMLHeadingElement> {
    variant: LabelVariant
    value: string | number | null
    className?: string
    loading?: boolean
    loadingClassName?: string
}

export const Label: FC<IProps> = ({ variant, value, loading, className, loadingClassName, ...props }) => {
    const isLoading = loading || !value

    if (isLoading) {
        return (
            <Skeleton variant={'rounded'} className={loadingClassName}/>
        )
    }

    const getClassName = (styles: string) => {
        return `${styles} ${className}`
    }

    switch (variant) {
        case 'h1':
            return <h1 className={getClassName('text-3xl font-semibold')} {...props}>
                { value }
            </h1>
        case 'h2':
            return <h2 className={getClassName('ml-3 font-semibold text-xl')} {...props}>
                  { value }
            </h2>
        case 'h3':
            return <h3 className={getClassName('')} {...props}>
                  { value }
            </h3>
        case 'h4':
            return <h4 className={getClassName('')} {...props}>
                  { value }
            </h4>
        case 'h5':
            return <h5 className={getClassName('')} {...props}>
                  { value }
            </h5>
        case 'h6':
            return <h6 className={getClassName('')} {...props}>
                  { value }
            </h6>
        default:
            return null
    }
}