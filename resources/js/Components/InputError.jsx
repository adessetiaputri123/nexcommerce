export default function InputError({
    message,
    className = '',
    ...props
}) {
    return message ? (
        <p
            {...props}
            className={`text-sm font-bold text-red-600 ${className}`}
        >
            {message}
        </p>
    ) : null;
}
