import { Popover } from "@mui/material";
import { FC, MouseEventHandler, ReactNode, useState } from "react";
import './Popovered.css'

interface IProps {
    renderEl: (handleClick: MouseEventHandler) => ReactNode
    children: ReactNode
}

export const Popovered: FC<IProps> = ({ children, renderEl }) => {
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;

  return (
    <div>
      {
        renderEl(handleClick) 
      }
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        sx={{
           
            
        }}
        className={`mt-4 popover_reset`}
        anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
        transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
        }}
        
      >
        { children }
      </Popover>
    </div>
  );
}