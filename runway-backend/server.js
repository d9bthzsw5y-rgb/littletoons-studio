
import express from "express";
import cors from "cors";
import RunwayML from "@runwayml/sdk";

const app = express();
app.use(express.json({ limit: "32kb" }));

const allowedOrigin = process.env.APP_ORIGIN;
const apiKey = process.env.RUNWAYML_API_SECRET;

if (!allowedOrigin || !apiKey) {
  throw new Error("Missing required environment variables.");
}

app.use(cors({
  origin: allowedOrigin
}));

const runway = new RunwayML({ apiKey });

app.post("/api/videos", async (req, res) => {
  try {
    const { prompt, ratio } = req.body ?? {};

    const validRatios = [
      "1280:720",
      "720:1280",
      "960:960"
    ];

    if (
      typeof prompt !== "string" ||
      prompt.trim().length < 3 ||
      prompt.length > 1800 ||
      !validRatios.includes(ratio)
    ) {
      return res.status(400).json({
        error: "Please check the video prompt and format."
      });
    }

    const task = await runway.textToVideo.create({
      model: "gen4.5",
      promptText: prompt.trim(),
      ratio,
      duration: 5
    });

    res.status(202).json({ taskId: task.id });
  } catch (error) {
    console.error("Video request failed:", error.message);
    res.status(502).json({
      error: "Unable to start video generation."
    });
  }
});

app.get("/api/videos/:id", async (req, res) => {
  try {
    const task = await runway.tasks.retrieve(req.params.id);

    res.json({
      status: task.status,
      videoUrl:
        task.status === "SUCCEEDED"
          ? task.output?.[0] ?? null
          : null
    });
  } catch (error) {
    console.error("Video status failed:", error.message);
    res.status(502).json({
      error: "Unable to check video status."
    });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`LittleToons backend listening on ${port}`);
});
