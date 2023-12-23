import { FC } from "react";

interface IProps {
    logo: string
    label: string
}

export const GuildLogo: FC<IProps> = ({ logo, label }) => {
    return <div>
        <img src={logo} alt={label} />
    </div>
}