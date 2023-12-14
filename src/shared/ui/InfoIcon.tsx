import { FC, useState } from "react";
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import { Popper } from "@mui/material";

interface IProps {
    message: string
}

export const InfoIcon: FC<IProps> = ({ message }) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
      setAnchorEl(anchorEl ? null : event.currentTarget);
    };
  
    const open = Boolean(anchorEl);

    return (
        <>
            <div className="w-6 h-6 cursor-pointer p-1 flex items-center justify-center rounded-full  text-white bg-zinc-300"
                 onClick={handleClick}
            >
                <QuestionMarkIcon sx={{ width: 16 }}/>
            </div>
            <Popper open={open} anchorEl={anchorEl}>
               <div className="bg-white max-w-64 shadow-md mt-2 rounded-md p-2 text-small">
                    { message }
               </div>
            </Popper>
        </>
    
    )
}