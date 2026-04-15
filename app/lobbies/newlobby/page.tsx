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
import { Button, Form, Input, Radio, InputNumber } from "antd";
import { CreateLobbyPostDTO, LobbyAccessDTO, LobbyCodeDTO } from "@/types/lobby";
import handleJoin from "@/lobbies/page";

const LobbyCreationPage: React.FC = () => {
  const router     = useRouter();
  const apiService = useApi();
  const [form]     = Form.useForm<CreateLobbyPostDTO>();

  

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleCreate = async (createLobbyPostDTO: CreateLobbyPostDTO) => {
    const response = await apiService.post<LobbyAccessDTO>("/lobbies", createLobbyPostDTO);
    const lobbyCodeDTO: LobbyCodeDTO = {
      lobbyCode: response.lobbyCode};

    handleJoin({ lobbyId: response.lobbyId, userId: response.userId, token: response.token, lobbyCodeDTO });
    
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
        <p className="form-subtitle">Create a new lobby</p>

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
            name="lobby name"
            label="Lobby Name"
            rules={[{ required: true, message: "Please enter a lobby name!" }]}
          >
            <Input placeholder="e.g. Pendler-Challenge" />
          </Form.Item>

          <Form.Item
            name="amount of players"
            label="Amount of Players"
            rules={[{ required: true, message: "Please enter the amount of players!" }]}
          >
            <InputNumber placeholder="e.g. 5" />
          </Form.Item>

          <Form.Item
            name="rounds"
            label="Rounds"
            rules={[{ required: true, message: "Please select amount of rounds to be played!" }]}
          >
            <Radio.Group>
              <Radio value={1}>1</Radio>
              <Radio value={3}>3</Radio>
              <Radio value={5}>5</Radio>
              <Radio value={10}>10</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="lobby visibility"
            label="Lobby Visibility"
            rules={[{ required: true, message: "Please select a visibility option!" }]}
          >
            <Radio.Group>
              <Radio value={true}>Private</Radio>
              <Radio value={false}>Public</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="form-submit-btn btn-full"
            >
              Create Lobby
            </Button>
          </Form.Item>

          

        </Form>
      </div>
    </div>
  );
};

export default LobbyCreationPage;