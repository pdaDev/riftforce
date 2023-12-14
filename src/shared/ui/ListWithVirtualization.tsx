import { Stack, Container, CircularProgress, Typography, Divider } from "@mui/material"
import { Fragment, ReactNode, Ref } from "react"

interface IProps<T extends object> {
    loading?: boolean
    fetching?: boolean
    renderListEl: (data: T | null, loading: boolean, index: number, isLastElement: boolean) => ReactNode
    data: T[] | null | undefined
    countOfLoadingEls?: number
    withDivider?: boolean
    emptyLabel?: string
    itemsContainerRef?: Ref<HTMLDivElement>
    virtualization?: boolean
}

export function List<T extends object>({
    data,
    renderListEl,
    loading,
    fetching,
    countOfLoadingEls = 5,
    withDivider,
    itemsContainerRef,
    emptyLabel
}: IProps<T>) {
    const showRenderedItems = !loading && data && data.length > 0
    const isNoData = !loading && (!data || (data && data.length === 0))
    const addingNewItems = fetching && !loading
    return (
        <Stack 
            spacing={2} 
            ref={itemsContainerRef}
        >
            { showRenderedItems && data.map((el, index, arr) => 
                <Fragment key={index}>
                    {renderListEl(el, false, index, index === arr.length - 1)}
                    { withDivider && index !== arr.length - 1 && <Divider/> }
                </Fragment>
            )}
            { loading && [...new Array(countOfLoadingEls)].map((_, index, arr) => 
                <Fragment key={index}>
                    { renderListEl(null as any, loading, index, false) }
                    { withDivider && index !== arr.length - 1 && <Divider/> }
                </Fragment>
            )}
            { isNoData &&
                    <Stack 
                        direction={'row'} 
                        justifyContent={'center'}
                    >
                        <Typography 
                            variant="h6" 
                            color={'gray'}
                        >
                            { emptyLabel }
                        </Typography>
                    </Stack>
            }
            { addingNewItems && 
                                        <Container sx={{ 
                                                    display: 'flex', 
                                                    width: '100%', 
                                                    justifyContent: 'center', 
                                                    mt: 2
                                        }}>
                                            <CircularProgress />
                                        </Container> 
            }
        </Stack>
    )
}
