import React from "react";
import { errorToString } from 'src/helper/errors';

interface Props {
    error: unknown
}

const ErrorTab: React.FC<Props> = (props) =>{
	const isEmptyString = (typeof props.error === 'string') && props.error == "";
	return (
		<div className="alert alert-danger" role="alert">
			{isEmptyString ? errorToString("Content not found") : errorToString(props.error)}
		</div>
	);
};

export {
	ErrorTab
};