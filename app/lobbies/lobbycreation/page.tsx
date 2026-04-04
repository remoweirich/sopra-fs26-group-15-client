"use client";

/**
 * Lobby Creation Screen  –  route: /lobbycreation
 *

 * Layout (inside page-center):
 *   .card.card--form
 *     .form-title          →  "🎯 New Lobby"
 *     .form-subtitle       →  "Set up your game."
 *     Ant Design Form
 *       Form.Item  "Lobby Name"   →  Input
 *       Form.Item  "Rounds"       →  custom round-selector (1 / 3 / 5 / 10)
 *       Form.Item  "Visibility"   →  custom visibility-selector (Public / Private)
 *       Form.Item  (submit)       →  Button "Create & Wait for Players"
 *
 * Classnames (all in globals.css):
 *   page-center
 *   card, card--form
 *   form-title, form-subtitle, form-submit-btn
 *   (round-selector & visibility-selector UI to be built as concrete components)
 *

 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
//import { Lobby } from "@/types";
import { Button, Form, Input } from "antd";

interface LobbyFormFields {
 /*Add form fields here*/
}

const LobbyCreationPage: React.FC = () => {
  const router     = useRouter();
  const apiService = useApi();
  const [form]     = Form.useForm<LobbyFormFields>();

  

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleCreate = async (values: LobbyFormFields) => {
    router.push("/lobbies/123"); // TODO: replace with actual new lobby ID from response
    
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="page-center page-content">
      <div className="card card--form">

        {/* Card header */}
        <h2 className="form-title">
          {/* TODO: target/dart icon */}
          New Lobby
        </h2>
        <p className="form-subtitle">Set up your game.</p>

        <Form
          form={form}
          name="lobby-creation"
          size="large"
          variant="outlined"
          layout="vertical"
          onFinish={handleCreate}
        >
            {/*To Do: add Form.Item for all items */}
          
          <Form.Item
            name="name"
            label="Lobby Name"
            rules={[{ required: true, message: "Please enter a lobby name!" }]}
          >
            <Input placeholder="e.g. Pendler-Challenge" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="form-submit-btn btn-full"
            >
              Create &amp; Wait for Players
            </Button>
          </Form.Item>

          

        </Form>
      </div>
    </div>
  );
};

export default LobbyCreationPage;