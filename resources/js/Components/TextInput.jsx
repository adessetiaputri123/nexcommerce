import {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef,
} from 'react';

export default forwardRef(function TextInput(
    {
        type = 'text',
        className = '',
        isFocused = false,
        ...props
    },
    ref,
) {
    const localRef = useRef(null);

    useImperativeHandle(ref, () => ({
        focus: () => localRef.current?.focus(),
    }));

    useEffect(() => {
        if (isFocused) {
            localRef.current?.focus();
        }
    }, [isFocused]);

    return (
        <input
            {...props}
            ref={localRef}
            type={type}
            className={`rounded-xl border-slate-200 bg-slate-50 text-sm shadow-none transition focus:border-emerald-500 focus:bg-white focus:ring-emerald-500 ${className}`}
        />
    );
});
