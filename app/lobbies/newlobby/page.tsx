"use client";


import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { Button, Form, Input, Radio, InputNumber } from "antd";
import { CreateLobbyPostDTO, LobbyAccessDTO, LobbyCodeDTO } from "@/types/lobby";
import { useLobbyActions } from "@/hooks/useLobbyActions";

const NewLobbyPage: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [form] = Form.useForm<CreateLobbyPostDTO>();
  const { handleJoin } = useLobbyActions();



  // ── Submit ──────────────────────────────────────────────────────────────
  const handleCreate = async (createLobbyPostDTO: CreateLobbyPostDTO) => {
    const rawToken = localStorage.getItem("token");
    const token = rawToken ? JSON.parse(rawToken) : "";

    const rawUserId = localStorage.getItem("userId");
    const userId = rawUserId ? JSON.parse(rawUserId) : -1;

    const payload = {
      lobbyName: createLobbyPostDTO.lobbyName,
      size: Number(createLobbyPostDTO.size),
      maxRounds: Number(createLobbyPostDTO.maxRounds),
      // WICHTIG: Boolean zu Enum-String konvertieren
      visibility: createLobbyPostDTO.visibility,
    };

    console.log("NewLobbyPage - Retrieved token from localStorage:", token);
    console.log("NewLobbyPage - Retrieved userId from localStorage:", userId);
    console.log("NewLobbyPage - Lobby creation data:", createLobbyPostDTO);

    // Aufruf mit 3 Argumenten:
    const response = await apiService.post<LobbyAccessDTO>(
      "/lobbies",              // 1. Endpoint
      payload,      // 2. Data (Body) - schicke direkt das DTO
      {                        // 3. Options (Headers)
        headers: {
          token: token,
          userId: userId,
        },
      }
    );

    localStorage.setItem("token", JSON.stringify(response.token));
    localStorage.setItem("userId", JSON.stringify(response.userId));

    const lobbyCodeDTO: LobbyCodeDTO = {
      lobbyCode: response.lobbyCode
    };

    handleJoin(response.lobbyId, lobbyCodeDTO);

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
            name="lobbyName"
            label="Lobby Name"
            rules={[{ required: true, message: "Please enter a lobby name!" }]}
          >
            <Input placeholder="e.g. Pendler-Challenge" />
          </Form.Item>

          <Form.Item
            name="size"
            label="Amount of Players"
            rules={[{ required: true, message: "Please enter the amount of players!" }]}
          >
            <InputNumber placeholder="e.g. 5" />
          </Form.Item>

          <Form.Item
            name="maxRounds"
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
            name="visibility"
            label="Lobby Visibility"
            rules={[{ required: true, message: "Please select a visibility option!" }]}
          >
            <Radio.Group>
              <Radio value={"PRIVATE"}>Private</Radio>
              <Radio value={"PUBLIC"}>Public</Radio>
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

export default NewLobbyPage;