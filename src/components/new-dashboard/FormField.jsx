const FormField = ({ label, note, labelTag = 'label', children, ...props }) => {
    const Component = labelTag

    return (
        <div className="flex flex-col gap-2 text-gray-800">
            <div className="flex flex-col gap-1">
                <Component className="text-sm font-medium" {...props}>
                    {label}
                </Component>

                {note && <p className="text-xs text-gray-500">{note}</p>}
            </div>

            {children}
        </div>
    )
}

export default FormField
