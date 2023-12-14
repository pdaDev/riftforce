import { ChangeEventHandler, FC } from "react"
import { FileSize, getFileSizeInBytes, useFileDrop } from ".."
import { Stack, Typography } from "@mui/material"

interface IProps {
    onLoadFiles: (files: FileList | null) => void
    accept?: string
    maxSize?: FileSize
    multiple?: boolean
}


export const FileLoader: FC<IProps> = ({ onLoadFiles, accept, multiple, maxSize }) => {

    const { dragStatus, dragUnderBLock, onDragLeave, onDragOver, onDrop } = useFileDrop()
 
    const onFileDrop = (files: FileList) => {
         if (accept) {
             const extensions = accept?.split(',')
             if (Array.from(files).every(file => extensions.some(ex => file.name.indexOf(ex) > -1))) {
                 if (checkMaxSize(files)) {
                     onLoadFiles(files)
                 }
             }
         } else if (checkMaxSize(files)) {
             onLoadFiles(files)
         }
    }
 
    const checkMaxSize = (files: FileList) => {
         if (maxSize) {
             const maxSizeInBytes = getFileSizeInBytes(maxSize)
 
             return Array.from(files).every(file => file.size <= maxSizeInBytes)
         }
 
         return true
    }
 
    const onChange: ChangeEventHandler<HTMLInputElement> = e => {
         const files = e.target.files
         if (files && checkMaxSize(files)) {
             onLoadFiles(files)
         }
    }
 
     return  (
         <label className="font-regular text-lg text-grey-600 font-sans">
             <div 
                 onDragOver={onDragOver}
                 onDragLeave={onDragLeave}
                 onDrop={onDrop(onFileDrop)}
                 className={`rounded-md border-8 cursor-pointer border-slate-600 bg-zinc-200 flex justify-center py-5 ${dragUnderBLock && "bg-zinc-400"}`}
             >
                 <input 
                     accept={accept} 
                     multiple={multiple} 
                     className="hidden" 
                     type={'file'} 
                     onChange={onChange}
                 />
                 { dragStatus
                     ? !dragUnderBLock
                         ? "Перенесите файл сюда"
                         : "Сбросьте файл" 
                     : maxSize
                         ? 
                         <Stack 
                             spacing={0.5}
                             justifyContent={'center'}
                             textAlign={'center'}
                           >
                             <Typography variant="h6">
                                 Загрузить файл
                             </Typography>
                             <Typography 
                                 fontSize={14}
                                 fontWeight={'light'}
                             >
                                 Максимальный вес файла не должен превышать {maxSize[0]} {maxSize[1]}
                             </Typography>
                           </Stack>
                         : "Загрузить файл"
                 }
             </div>
         </label>
     )
 }