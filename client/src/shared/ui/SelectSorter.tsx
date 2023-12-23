import { SelectChangeEvent, Stack, Typography, Select, MenuItem } from "@mui/material"
import { FC } from "react"
import { SorterStore } from "../../Classes/Services"
import { IOption } from ".."

interface IProps {
    options?: IOption[]
    sorter: SorterStore
}
export const SelectSorter: FC<IProps> = ({ sorter, options }) => {

    const { defaultSortOptions, setSort, sort } = sorter
    const sorterOptions = options || defaultSortOptions

    const onSort = (e: SelectChangeEvent) => {
        setSort(e.target.value)
    }

    return  (
        <Stack 
            direction={'row'} 
            alignItems={'center'} 
            spacing={2}
        >
            <Typography>
                Сортировать по
            </Typography>
            <Select
                size="small"
                value={sort || ''}
                placeholder="Выберите сортировку"
                onChange={onSort}
            >
                {
                    sorterOptions.map(o => 
                        <MenuItem 
                            key={o.value}
                            value={o.value} 
                            sx={{ mr: 2 }}
                        >
                                { o.label }
                                <Typography 
                                    display={'inline'} 
                                    ml={1.5}
                                >
                                ↑
                                </Typography>
                        </MenuItem> )
                }
                {
                    sorterOptions.map(o => 
                        <MenuItem 
                            key={`-${o.value}`} 
                            value={`-${o.value}`} 
                            sx={{ mr: 2 }}
                        >
                            { o.label }
                            <Typography 
                                display={'inline'} 
                                ml={1.5}
                            >
                                ↓
                            </Typography>
                        </MenuItem>)
                }
            </Select>
        </Stack>
    )
}