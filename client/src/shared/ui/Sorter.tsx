import { FC } from "react"

export interface IProps {
    sort: string
    currentSort: string | null
    label: string
    onChange: (sort: string | null) => void
    keyProps?: {
        descending: string
        ascending: string
        pos: 'start' | 'end'
    }
}

export const Sorter: FC<IProps> = ({
                                       label,
                                       currentSort,
                                       sort,
                                       onChange,
                                       keyProps
                                   }) => {
    const ascendingKey = keyProps?.ascending || 'ASC:'
    const descendingKey = keyProps?.descending || 'DESC:'
    const keyPos = keyProps?.pos || 'start'
    const descRegex = new RegExp(descendingKey)
    const ascRegex = new RegExp(ascendingKey)
    const isDescending = descRegex.test(currentSort || '')

    const getSortWithDirectionKey = (sort: string, direction: string) => {
        return keyPos === 'start'
        ? `${direction}${sort}`
        : `${sort}${direction}`
    }

    const invertSortDirection = (sort: string) => {
        return descRegex.test(sort)
            ? getSortWithDirectionKey(sort.replace(descRegex, ''), ascendingKey)
            : getSortWithDirectionKey(sort.replace(ascRegex, ''), descendingKey)
    }

    let currentSortWithoutDirectionKey = (currentSort || '').replace(descRegex, '')
    currentSortWithoutDirectionKey = currentSortWithoutDirectionKey.replace(ascRegex, '')

    const isActive = currentSortWithoutDirectionKey === sort

    const onSort = () => {
        onChange(isActive
            ? !isDescending
                ? invertSortDirection(currentSort || '')
                : null
            : getSortWithDirectionKey(sort, ascendingKey)
        )
    }


    return <div onClick={onSort}>
        <div>
            {label}
        </div>
        {isActive && (
            <div>

            </div>
        )}
    </div>
}
