import { Box } from "@mui/material";
import { FC, useMemo } from "react";
import { FileLoader } from "../../../shared";


interface IProps {
    onLoad: (file: File | null) => void
    avatar: File | string | null
}

export const UserAvatarLoader: FC<IProps> = ({ onLoad, avatar }) => {

    const avatarURL = useMemo(() => {
        if (typeof avatar === 'string') {
            return avatar
        } 
        if (avatar) {
             return URL.createObjectURL(avatar)
        }
        return ''       
    }, [avatar])

    const onChange = (files: null | FileList) => {
        if (files) {
            onLoad(files[0])
        }

    }

    return (
        <label>
            <Box sx={{
                    width: 210,
                    height: 210,
                    borderRadius: '50%',
                    overflow: 'hidden'
            }}>
                <img 
                    src={avatarURL} 
                    style={{ 
                        objectFit: 'contain',
                        width: '100%' 
                    }}
                />
            </Box>
        <FileLoader onLoadFiles={onChange}
                    accept=".png"
                    maxSize={[10, 'MB']}
                    
        />
                    
    </label>
    )
}

