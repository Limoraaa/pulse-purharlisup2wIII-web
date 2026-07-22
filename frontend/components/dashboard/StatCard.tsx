"use client";
// import node module libraries
import { FC, ReactNode } from "react";
import { Card, CardBody } from "react-bootstrap";

/**
 * StatCard
 * Kartu statistik reusable untuk Dashboard (icon + judul + nilai + trend opsional).
 * Murni komponen presentasi — tidak menyimpan logic bisnis.
 */
export interface StatCardProps {
  /** Icon (mis. dari @tabler/icons-react) */
  icon: ReactNode;
  /** Label/judul metrik */
  title: string;
  /** Nilai metrik */
  value: ReactNode;
  /** Warna tema Bootstrap untuk aksen icon (primary, info, success, warning, danger) */
  variant?: "primary" | "info" | "success" | "warning" | "danger";
  /** Teks trend kecil opsional (mis. "+12% bulan ini") */
  trend?: string;
  /** Arah trend untuk pewarnaan teks trend */
  trendDirection?: "up" | "down" | "neutral";
}

const trendColorMap: Record<NonNullable<StatCardProps["trendDirection"]>, string> = {
  up: "text-success",
  down: "text-danger",
  neutral: "text-secondary",
};

const StatCard: FC<StatCardProps> = ({
  icon,
  title,
  value,
  variant = "primary",
  trend,
  trendDirection = "neutral",
}) => {
  return (
    <Card className="card-lg h-100 stat-card">
      <CardBody className="d-flex align-items-center gap-3">
        <div
          className={`bg-${variant}-subtle text-${variant} rounded-3 d-flex align-items-center justify-content-center flex-shrink-0`}
          style={{ width: 52, height: 52 }}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-secondary small mb-1">{title}</div>
          <div className="h3 mb-0 lh-1">{value}</div>
          {trend && (
            <div className={`small mt-1 ${trendColorMap[trendDirection]}`}>{trend}</div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default StatCard;
