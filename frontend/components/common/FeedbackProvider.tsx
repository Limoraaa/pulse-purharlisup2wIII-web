"use client";
import { createContext, useCallback, useContext, useRef, useState } from "react";
import { Button, Modal, Toast, ToastContainer } from "react-bootstrap";
import { IconAlertTriangle, IconCircleCheck, IconInfoCircle } from "@tabler/icons-react";

type NotifyVariant = "success" | "danger" | "warning" | "info";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary" | "warning";
}

interface FeedbackContextValue {
  /** Pengganti alert(): notifikasi kecil di pojok kanan atas, hilang sendiri */
  notify: (message: string, variant?: NotifyVariant) => void;
  /** Pengganti confirm(): modal konfirmasi, resolve true bila user menyetujui */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

const ICON: Record<NotifyVariant, React.ElementType> = {
  success: IconCircleCheck,
  danger: IconAlertTriangle,
  warning: IconAlertTriangle,
  info: IconInfoCircle,
};

/**
 * Pop-up bergaya aplikasi untuk seluruh halaman, menggantikan alert()/confirm() bawaan browser.
 * Pakai lewat hook: const { notify, confirm } = useFeedback();
 */
export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<{ id: number; message: string; variant: NotifyVariant }[]>([]);
  const [dialog, setDialog] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const notify = useCallback((message: string, variant: NotifyVariant = "danger") => {
    setToasts((prev) => [...prev, { id: Date.now() + Math.random(), message, variant }]);
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    resolver.current?.(false);
    setDialog(options);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const closeDialog = (result: boolean) => {
    resolver.current?.(result);
    resolver.current = null;
    setDialog(null);
  };

  return (
    <FeedbackContext.Provider value={{ notify, confirm }}>
      {children}

      <ToastContainer position="top-end" className="p-3 position-fixed" style={{ zIndex: 2000 }}>
        {toasts.map((t) => {
          const Icon = ICON[t.variant];
          return (
            <Toast
              key={t.id}
              bg={t.variant}
              autohide
              delay={t.variant === "danger" ? 6000 : 4000}
              onClose={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
            >
              <Toast.Body className={`d-flex align-items-start gap-2 ${t.variant === "warning" ? "" : "text-white"}`}>
                <Icon size={18} className="flex-shrink-0 mt-1" />
                <span className="flex-grow-1">{t.message}</span>
                <button
                  type="button"
                  className={`btn-close btn-close-sm ${t.variant === "warning" ? "" : "btn-close-white"}`}
                  aria-label="Tutup"
                  onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                />
              </Toast.Body>
            </Toast>
          );
        })}
      </ToastContainer>

      <Modal show={!!dialog} onHide={() => closeDialog(false)} centered contentClassName="border-0 rounded-4">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fs-5 fw-bold">{dialog?.title ?? "Konfirmasi"}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-secondary">{dialog?.message}</Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" className="border" onClick={() => closeDialog(false)}>
            {dialog?.cancelLabel ?? "Batal"}
          </Button>
          <Button variant={dialog?.variant ?? "danger"} onClick={() => closeDialog(true)} autoFocus>
            {dialog?.confirmLabel ?? "Ya, lanjutkan"}
          </Button>
        </Modal.Footer>
      </Modal>
    </FeedbackContext.Provider>
  );
}

export function useFeedback(): FeedbackContextValue {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error("useFeedback harus dipakai di dalam FeedbackProvider");
  return ctx;
}
