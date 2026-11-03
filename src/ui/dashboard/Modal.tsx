import React from "react";

interface ModalProps {
	isOpen: boolean;
	onClose: (e: React.MouseEvent<HTMLElement>) => void;
	children: React.ReactNode;
	title: string;
	panelClassName?: string;
	bodyClassName?: string;
}

const Modal: React.FC<ModalProps> = ({
	isOpen,
	onClose,
	children,
	title,
	panelClassName,
	bodyClassName,
}) => {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div
				className={`bg-white p-0 rounded-lg relative min-w-[300px] max-h-[85vh] flex flex-col ${panelClassName ?? ""}`}
			>
				<div className="w-full flex flex-row justify-between items-center py-2 px-4 bg-neutral-100 mb-3 rounded-t-lg shrink-0">
					<h2 className="text-md text-black font-bold m-0 p-0">{title}</h2>
					<button
						className="bg-transparent border-none text-xl text-black cursor-pointer"
						onClick={onClose}
					>
						&times;
					</button>
				</div>
				<div className={`p-4 max-w-[840px] overflow-y-auto flex-1 min-h-0 ${bodyClassName ?? ""}`}>
					{children}
				</div>
			</div>
		</div>
	);
};

export default Modal;
