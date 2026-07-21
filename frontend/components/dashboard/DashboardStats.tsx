"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Col, Card, CardBody } from "react-bootstrap";
import {
  IconBriefcase,
  IconListCheck,
  IconTool,
  IconUsers,
} from "@tabler/icons-react";

interface DashboardStats {
  total_tools: number;
  tools_ready: number;
  tools_dipinjam: number;
  tools_rusak: number;
  total_consumable: number;
}

export default function DashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/dashboard`
      );

      setStats(res.data.stats);
    } catch (err) {
      console.error(err);
    }
  };

  if (!stats) {
    return (
      <>
        {[1, 2, 3, 4].map((i) => (
          <Col xl={3} md={6} key={i}>
            <Card className="card-lg">
              <CardBody className="text-center py-5">
                Loading...
              </CardBody>
            </Card>
          </Col>
        ))}
      </>
    );
  }

  const cards = [
    {
      title: "Total Tools",
      value: stats.total_tools,
      icon: <IconBriefcase size={24} strokeWidth={1.5} />,
      bgColor: "bg-gradient-tools",
      textColor: "text-success-emphasis",
      bottom: `${stats.tools_ready} Ready`,
    },
    {
      title: "Consumable",
      value: stats.total_consumable,
      icon: <IconListCheck size={24} strokeWidth={1.5} />,
      bgColor: "bg-gradient-info",
      textColor: "text-info-emphasis",
      bottom: "Total Stock",
    },
    {
      title: "Dipinjam",
      value: stats.tools_dipinjam,
      icon: <IconUsers size={24} strokeWidth={1.5} />,
      bgColor: "bg-gradient-success",
      textColor: "text-warning-emphasis",
      bottom: "Belum Kembali",
    },
    {
      title: "Rusak",
      value: stats.tools_rusak,
      icon: <IconTool size={24} strokeWidth={1.5} />,
      bgColor: "bg-gradient-warning",
      textColor: "text-danger-emphasis",
      bottom: "Perlu Perbaikan",
    },
  ];

  return (
    <>
      {cards.map((card, index) => (
        <Col xl={3} md={6} key={index}>
          <Card className={`card-lg ${card.bgColor}`}>
            <CardBody className="d-flex flex-column gap-8">
              <div className="d-flex justify-content-between align-items-center">
                <div className="fw-semibold">{card.title}</div>

                <div className={card.textColor}>{card.icon}</div>
              </div>

              <div className="lh-1 d-flex flex-column gap-3">
                <div className="fs-1 fw-bold">{card.value}</div>

                <p className="mb-0">
                  <span className={`me-1 ${card.textColor}`}>
                    {card.bottom}
                  </span>
                </p>
              </div>
            </CardBody>
          </Card>
        </Col>
      ))}
    </>
  );
}