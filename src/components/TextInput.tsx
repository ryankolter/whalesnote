import classNames from 'classnames';
import { useRef, useEffect } from 'react';

interface TextInputProps
    extends React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
    value: string;
}

export const TextInput: React.FC<TextInputProps> = (props) => {
    const textAreaRef = useRef<HTMLInputElement>(null);

    const { value, className, autoFocus = true, ...restProps } = props;

    useEffect(() => {
        textAreaRef.current?.setSelectionRange(-1, -1);
    }, []);

    return (
        <div>
            <input
                ref={textAreaRef}
                className={classNames('textInput', className)}
                {...restProps}
                value={value}
                autoFocus={autoFocus}
            />
        </div>
    );
};
