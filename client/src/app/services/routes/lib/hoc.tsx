import {ComponentType, FC, Suspense} from "react";
import {BrowserRouter} from "react-router-dom";

export const withRouter = (Component: ComponentType) => {
    const Container: FC = () => {
        return <BrowserRouter>
            <Suspense fallback={'...'}>
                <Component/>
            </Suspense>
        </BrowserRouter>

    }

    return Container
}