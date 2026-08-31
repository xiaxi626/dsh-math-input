import { type ReactNode } from 'react';
export type ModalProps = {
    readonly title: string;
    readonly onClose: () => void;
    readonly children: ReactNode;
};
export declare function Modal({ title, onClose, children }: ModalProps): import("react").ReactPortal;
