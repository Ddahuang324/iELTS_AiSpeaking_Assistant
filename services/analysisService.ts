
import { GoogleGenAI, Type } from '@google/genai';
import { TranscriptItem, AnalysisResult } from '../types';

export const MOCK_SAMPLE_RESULT: AnalysisResult = {
  id: 'sample-session-001',
  date: new Date(Date.now() - 86400000 * 2).toISOString(),
  overall_feedback: {
    strengths: [
      { point: "词汇量较丰富", example: "You used words like 'landscape' and 'unique' correctly." }
    ],
    areas_for_improvement: [
      { point: "流利度有待提高", example: "There were many 'um's and 'uh's in your speech." }
    ],
    key_recommendations: [
      { point: "减少犹豫词的使用", example: "Try to pause silently instead of saying 'um'." }
    ]
  },
  ielts_band_score: {
    fluency_and_coherence: { score: 5.0, rationale: "频繁的犹豫标记影响了连贯性。" },
    lexical_resource: { score: 6.0, rationale: "词汇量尚可，但有一些搭配错误。" },
    grammatical_range_and_accuracy: { score: 5.5, rationale: "存在一些基础语法错误，如主谓一致。" },
    pronunciation: { score: 6.0, rationale: "整体清晰，但部分元音发音不准确。" },
    overall: { score: 5.5, rationale: "整体表现尚可，需重点提升流利度。" }
  },
  grammar_errors: [
    {
      type: "主谓不一致",
      original_sentence: "He go to school everyday.",
      text: "go",
      description: "第三人称单数主语后动词应加s",
      suggestions: ["He goes to school everyday."]
    }
  ],
  word_choice_issues: [
    {
      type: "搭配错误",
      original_sentence: "I did a mistake in the exam.",
      text: "did a mistake",
      suggestion: "made a mistake"
    }
  ],
  vocabulary_assessment: {
    advanced_words_found: ["landscape", "unique", "perspective"],
    vocabulary_suggestions: [
      {
        overused_word: "good",
        original_sentence: "It was a very good experience.",
        suggested_rewrites: ["It was a remarkable experience.", "It was a memorable experience."]
      }
    ]
  },
  fluency_markers: {
    analysis: "语速适中，但在思考复杂句式时有明显停顿。",
    hesitation_markers: [
      { marker: "um", count: 5 },
      { marker: "uh", count: 3 }
    ],
    connectors_used: ["and", "but", "so"]
  },
  pronunciation_analysis: {
    analysis: "整体发音清晰，但在长单词的重音上偶尔出错。",
    potential_patterns: [
      { suspected_issue: "/th/ 音发成 /s/", evidence: ["think -> sink", "thought -> sought"] }
    ]
  },
  native_audio_analysis: {
    overall_scores: {
      intonation: {
        score: 65,
        analysis: "语调较为平淡，缺乏抑扬顿挫，特别是在陈述句结尾处。"
      },
      tone: {
        score: 70,
        analysis: "语气总体友好，但有时显得不够自信，缺乏情感投入。"
      },
      spoken_vocabulary: {
        score: 60,
        analysis: "口语词汇使用一般，部分单词重音位置不准确，影响了表达的清晰度。"
      }
    },
    optimization_suggestions: [
      {
        category: "语调练习",
        specific_issue: "陈述句结尾语调下降过快,听起来不够自然",
        actionable_steps: [
          "练习在句尾保持语调平稳2-3秒,避免突然下降",
          "录音对比自己和母语者的语调曲线",
          "每天朗读5个陈述句,注意控制结尾语调"
        ],
        example: "尝试朗读: 'I go to school every day.' 在'day'处保持语调平稳,不要突然下降"
      },
      {
        category: "重音训练",
        specific_issue: "多音节单词的重音位置经常出错,如'important'、'beautiful'等",
        actionable_steps: [
          "使用在线词典查看每个生词的音标和重音标记",
          "练习常见多音节词汇,标注重音位置",
          "跟读练习,模仿母语者的重音模式"
        ],
        example: "正确重音: im'portant (第二音节), 'beautiful (第一音节)"
      },
      {
        category: "情感表达",
        specific_issue: "语气过于平淡,缺乏情感色彩,不能有效传达态度",
        actionable_steps: [
          "练习用不同语气表达同一句话(兴奋、遗憾、惊讶)",
          "观看英语影视作品,注意角色的情感表达方式",
          "在关键词上加强语气,如表达喜好时在'love'、'enjoy'上加重"
        ],
        example: "对比练习: 平淡地说'I like it.'和热情地说'I really LOVE it!'"
      }
    ]
  },
  standard_responses: [
    {
      examiner_question: "Can you tell me about your hometown?",
      candidate_answer_outline: "考生提到家乡是一个小城市，有美丽的风景，人们很友好",
      standard_response: "I come from a charming small city nestled in the countryside. What makes it particularly special is its breathtaking natural landscape, with rolling hills and pristine rivers. The community there is incredibly warm and welcoming, which creates a wonderful sense of belonging for residents and visitors alike."
    },
    {
      examiner_question: "What do you like to do in your free time?",
      candidate_answer_outline: "考生提到喜欢阅读和运动，特别是跑步",
      standard_response: "In my leisure time, I am particularly passionate about reading and staying physically active. I find that running is an excellent way to maintain both my physical fitness and mental clarity. It gives me the opportunity to clear my mind while enjoying the outdoors, which I find incredibly refreshing."
    }
  ]
};

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    overall_feedback: {
      type: Type.OBJECT,
      properties: {
        strengths: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              point: { type: Type.STRING },
              example: { type: Type.STRING }
            }
          }
        },
        areas_for_improvement: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              point: { type: Type.STRING },
              example: { type: Type.STRING }
            }
          }
        },
        key_recommendations: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              point: { type: Type.STRING },
              example: { type: Type.STRING }
            }
          }
        },
      },
    },
    ielts_band_score: {
      type: Type.OBJECT,
      properties: {
        fluency_and_coherence: {
          type: Type.OBJECT,
          properties: { score: { type: Type.NUMBER }, rationale: { type: Type.STRING } },
        },
        lexical_resource: {
          type: Type.OBJECT,
          properties: { score: { type: Type.NUMBER }, rationale: { type: Type.STRING } },
        },
        grammatical_range_and_accuracy: {
          type: Type.OBJECT,
          properties: { score: { type: Type.NUMBER }, rationale: { type: Type.STRING } },
        },
        pronunciation: {
          type: Type.OBJECT,
          properties: { score: { type: Type.NUMBER }, rationale: { type: Type.STRING } },
        },
        overall: {
          type: Type.OBJECT,
          properties: { score: { type: Type.NUMBER }, rationale: { type: Type.STRING } },
        },
      },
    },
    grammar_errors: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING },
          original_sentence: { type: Type.STRING },
          text: { type: Type.STRING },
          description: { type: Type.STRING },
          suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
      },
    },
    word_choice_issues: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING },
          original_sentence: { type: Type.STRING },
          text: { type: Type.STRING },
          suggestion: { type: Type.STRING },
        },
      },
    },
    vocabulary_assessment: {
      type: Type.OBJECT,
      properties: {
        advanced_words_found: { type: Type.ARRAY, items: { type: Type.STRING } },
        vocabulary_suggestions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              overused_word: { type: Type.STRING },
              original_sentence: { type: Type.STRING },
              suggested_rewrites: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
          },
        },
      },
    },
    fluency_markers: {
      type: Type.OBJECT,
      properties: {
        analysis: { type: Type.STRING },
        hesitation_markers: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              marker: { type: Type.STRING },
              count: { type: Type.INTEGER },
            },
          },
        },
        connectors_used: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
    },
    pronunciation_analysis: {
      type: Type.OBJECT,
      properties: {
        analysis: { type: Type.STRING },
        potential_patterns: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              suspected_issue: { type: Type.STRING },
              evidence: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
          },
        },
      },
    },
    native_audio_analysis: {
      type: Type.OBJECT,
      properties: {
        overall_scores: {
          type: Type.OBJECT,
          properties: {
            intonation: {
              type: Type.OBJECT,
              properties: { score: { type: Type.NUMBER }, analysis: { type: Type.STRING } }
            },
            tone: {
              type: Type.OBJECT,
              properties: { score: { type: Type.NUMBER }, analysis: { type: Type.STRING } }
            },
            spoken_vocabulary: {
              type: Type.OBJECT,
              properties: { score: { type: Type.NUMBER }, analysis: { type: Type.STRING } }
            }
          }
        },
        optimization_suggestions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              specific_issue: { type: Type.STRING },
              actionable_steps: { type: Type.ARRAY, items: { type: Type.STRING } },
              example: { type: Type.STRING }
            },
            required: ["category", "specific_issue", "actionable_steps"]
          }
        }
      },
      required: ["overall_scores", "optimization_suggestions"]
    },
    standard_responses: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          examiner_question: { type: Type.STRING },
          candidate_answer_outline: { type: Type.STRING },
          standard_response: { type: Type.STRING }
        }
      }
    }
  },
  required: ["overall_feedback", "ielts_band_score", "grammar_errors", "word_choice_issues", "vocabulary_assessment", "fluency_markers", "pronunciation_analysis", "native_audio_analysis", "standard_responses"]
};

// Helper to convert Blob to Base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const SYSTEM_PROMPT = `
你是专业的雅思口语考官。你的任务是分析用户的英语口语文本，并以结构化的JSON格式提供详细评估。
你的所有分析、描述、理由和类型属性都必须使用中文。然而，所有引用的用户原文、例子以及建议修改的英文句子或短语都必须保持英文。
严格遵守下面提供的JSON结构，不要输出JSON对象之外的任何内容。

**关键指令：**
1.  **不要总结 (NO SUMMARIES)**：请列出整个对话流程中发现的**每一个**错误。不要只给出几个代表性的例子。如果用户犯了10个语法错误，请列出全部10个。
2.  **全面性 (COMPREHENSIVE)**：仔细检查每一句话，确保没有遗漏任何明显的语法、用词或发音问题。
3.  **JSON格式**: 输出必须是合法的JSON格式，能够被前端直接解析。

在分析时，请注意以下几点（例如，拼写错误、不合逻辑的短语）。你的分析需要考虑到这些潜在问题：
- **停顿/重复**: 像 'um', 'uh' 或重复的单词应被视为流利度问题，并记录在'fluency_markers'中，而不是词汇错误。
- **发音推断**: 如果转录的某个词看起来像是另一个词的可能发音错误（例如，文本中是'ship'，但语境暗示应该是'sheep'），这应作为'pronunciation_analysis'中推断潜在发音模式的依据。

你的分析必须覆盖以下雅思标准：

1.  **综合反馈 (Overall Feedback)**: 提供建设性的优势、待改进领域和关键建议。**每个要点都必须有从用户文本中提取的具体例子（引文）作为支撑**。
2.  **雅思分数评估 (IELTS Band Score)**: 为流利度与连贯性、词汇资源、语法范围与准确性、发音四个维度估算分数（0-9），并为每个分数提供理由（中文）。
3.  **语法错误 (Grammar Errors)**: 识别具体的语法错误。**必须列出对话中出现的所有语法错误，不要遗漏**。对于每个错误，提供包含错误的**原始句子**、错误的文本片段、错误描述（中文）和修正建议（英文）。
4.  **用词问题 (Word Choice Issues)**: 识别用词不当或不自然的表达。**必须列出对话中出现的所有用词问题**。对于每个问题，提供**原始句子**、有问题的短语、更好的替代方案，并为问题指定一个具体的属性（例如：'用词不当', '搭配错误', '过于口语化', '表意不清'）。
5.  **词汇评估 (Vocabulary Assessment)**:
    - 列出任何正确使用的高级或习语词汇。
    - 识别过度使用的基础词汇，并**提供使用高级词汇对原句进行改写的建议**。
6.  **流利度标记 (Fluency Markers)**:
    - 识别并统计犹豫标记（如 'um', 'uh', 'like'）。
    - 列出使用的连接词。
    - **对语速、节奏和自我修正等进行综合分析**。
7.  **发音分析 (Pronunciation Analysis)**:
    - 基于文本提供一个总体评价，并承认其局限性。
    - **根据STT的可能错误，推断潜在的发音模式问题**（例如，混淆了哪些音）。
8.  **原生音频分析 (Native Audio Analysis)**:
    - **总体评分 (Overall Scores)**：
      * 语调 (Intonation): 评分（0-100）并分析语调的自然度、抑扬顿挫
      * 语气 (Tone): 评分（0-100）并分析语气的自信度、情感表达
      * 口语词汇 (Spoken Vocabulary): 评分（0-100）并分析单词重音、连读等口语特征
    
    - **优化建议 (Optimization Suggestions)** - **这是最重要的部分**：
      * 每条建议必须是一个结构化对象,包含以下字段:
        - category (必填): 明确的类别标签,如"语调练习"、"重音训练"、"连读技巧"、"情感表达"、"节奏控制"
        - specific_issue (必填): 具体问题描述,不要笼统
          · ❌ 错误示例: "语调不够自然"
          · ✅ 正确示例: "陈述句结尾语调下降过快,听起来生硬"
        - actionable_steps (必填): 3-5个具体可操作的改进步骤数组
          · 每个步骤必须清晰、具体、可执行
          · ✅ 示例: "练习在句尾保持语调平稳2-3秒,避免突然下降"
          · ✅ 示例: "录音对比自己和母语者的语调曲线"
          · ✅ 示例: "每天朗读5个陈述句,注意控制结尾语调"
        - example (可选): 具体的练习示例
          · ✅ 示例: "尝试朗读: 'I go to school every day.' 在'day'处保持语调平稳"
      * 建议数量: 提供3-5条建议,每条针对不同的具体问题
      * 避免笼统描述,每条建议都要有明确的改进方向和练习方法

9.  **规范回答 (Standard Responses)**:
    - 从对话中识别考官（Examiner）提出的每一个问题。
    - 总结考生（Candidate）针对每个问题的回答要点（中文）。
    - 基于考生的回答内容和意图，生成一个标准的、高分的雅思口语回答（英文）。
    - 标准回答应该：
      * 保持考生原有的观点和内容方向
      * 使用更高级的词汇和语法结构
      * 展现更好的流利度和连贯性
      * 符合雅思 7-8 分的标准
      * 长度适中，不要过于冗长
`;

export const generateAnalysisReport = async (transcripts: TranscriptItem[], apiKey: string, audioBlob?: Blob | null): Promise<AnalysisResult | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey });

    // Convert transcript to string
    const transcriptText = transcripts.map(t =>
      `${t.role === 'user' ? 'Candidate' : 'Examiner'}: ${t.text}`
    ).join('\n');

    const parts: any[] = [
      {
        text: `${SYSTEM_PROMPT}
      
      Transcript:
      ${transcriptText}
      `
      }
    ];

    // If audio exists, add it to the request
    if (audioBlob) {
      const audioBase64 = await blobToBase64(audioBlob);
      parts.push({
        inlineData: {
          mimeType: "audio/webm",
          data: audioBase64
        }
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-lite',
      contents: [
        {
          role: 'user',
          parts: parts
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: ANALYSIS_SCHEMA as any,
      }
    });

    const responseText = response.text;
    if (!responseText) throw new Error("Empty response from AI");

    const data = JSON.parse(responseText);

    return {
      id: `session-${Date.now()}`,
      date: new Date().toISOString(),
      ...data
    };

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return null;
  }
};
