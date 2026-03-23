| Model shown in ChatGPT web                            | Picker label / mode | Official status in ChatGPT web                                                                        |         Model context window (official) |            ChatGPT web context cap if officially stated | Plan / access notes                                                                                                                                                                              |
| ----------------------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------: | ------------------------------------------------------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **GPT-5.4 Thinking**                                  | Thinking            | Current main model                                                                                    | **Not publicly stated in ChatGPT help** | **196K** in Business; Thinking/Pro listed as 196K there | Plus/Business/Pro/Enterprise/Edu access varies by plan; Pro adds more thinking-time options. ([OpenAI Help Center][1])                                                                           |
| **GPT-5.3 Instant**                                   | Instant             | Current main model                                                                                    | **Not publicly stated in ChatGPT help** |                         **32K** in Business for Instant | Available to all tiers; paid tiers can manually pick it. ([OpenAI Help Center][2])                                                                                                               |
| **GPT-5.4 Pro**                                       | Pro                 | Current, but only higher tiers                                                                        | **Not publicly stated in ChatGPT help** |  **196K** in Business page’s “Thinking and Pro” wording | Pro / Business / Enterprise / Edu only. ([OpenAI Help Center][2])                                                                                                                                |
| **GPT-5.2 Thinking**                                  | Legacy Thinking     | Legacy but still available in some pickers                                                            |                                **400K** |  **196K** where ChatGPT Business states Thinking = 196K | Explicitly remains in Legacy Models for 90 days after GPT-5.4 Thinking launch for Plus/Pro; Business docs say additional GPT-5.2 options can appear directly in picker. ([OpenAI Developers][3]) |
| **GPT-5.2 Instant**                                   | Legacy Instant      | Legacy / additional picker option in some accounts                                                    |                                **400K** |     **32K** where ChatGPT Business states Instant = 32K | Business docs explicitly mention additional GPT-5.2 options in the picker. ([OpenAI Developers][3])                                                                                              |
| **GPT-5 mini** *(likely what you mean by “5.0 mini”)* | Mini                | Legacy / optional depending on account surface; official model name is **GPT-5 mini**, not “5.0 mini” |                                **400K** |             **No ChatGPT-specific cap publicly stated** | Official model exists; whether it appears in your web picker depends on account/workspace UI. ([OpenAI Developers][4])                                                                           |
| **o3**                                                | o3                  | Available in some ChatGPT plans/workspaces                                                            |                                **200K** |             **No consumer ChatGPT cap publicly stated** | Officially listed in Enterprise/Edu models & limits; Pro/legacy access can expose older models in ChatGPT. ([OpenAI Developers][5])                                                              |

[1]: https://help.openai.com/en/articles/12003714-chatgpt-business-models-limits?utm_source=chatgpt.com "ChatGPT Business - Models & Limits"
[2]: https://help.openai.com/en/articles/11909943-gpt-53-and-gpt-54-in-chatgpt?utm_source=chatgpt.com "GPT-5.3 and GPT-5.4 in ChatGPT"
[3]: https://developers.openai.com/api/docs/models/gpt-5.2?utm_source=chatgpt.com "GPT-5.2 Model | OpenAI API"
[4]: https://developers.openai.com/api/docs/models/gpt-5-mini?utm_source=chatgpt.com "GPT-5 mini Model | OpenAI API"
[5]: https://developers.openai.com/api/docs/models/o3?utm_source=chatgpt.com "o3 Model | OpenAI API"

The most defensible way to read this is:

- Current default ChatGPT web models: GPT-5.3 Instant and GPT-5.4 Thinking.
- Legacy-but-still-visible for some users: GPT-5.2 Instant / Thinking, and sometimes older or specialty models via legacy access or workspace configuration.
- Exact ChatGPT web context caps are only clearly documented in a few places. The clearest official numbers I found are 32K for Instant and 196K for Thinking/Pro on the Business models-and-limits page. For o3 and GPT-5 mini, OpenAI publishes the model context windows, but not a separate ChatGPT web cap for general consumer use.

So the closest estimate for the best number to use in ChatGPT web is:
| Model            |                                                                             Best number to use in ChatGPT web |
| ---------------- | ------------------------------------------------------------------------------------------------------------: |
| GPT-5.3 Instant  | **32K** documented in ChatGPT Business; consumer exact cap not separately published ([OpenAI Help Center][1]) |
| GPT-5.4 Thinking |                                             **196K** documented in ChatGPT Business ([OpenAI Help Center][1]) |
| GPT-5.2 Instant  |        **32K** if treated like Instant in ChatGPT; **400K** underlying model window ([OpenAI Help Center][1]) |
| GPT-5.2 Thinking |      **196K** if treated like Thinking in ChatGPT; **400K** underlying model window ([OpenAI Help Center][1]) |
| GPT-5 mini       |                **400K** underlying model window; ChatGPT cap not publicly documented ([OpenAI Developers][2]) |
| o3               |                **200K** underlying model window; ChatGPT cap not publicly documented ([OpenAI Developers][3]) |

[1]: https://help.openai.com/en/articles/12003714-chatgpt-business-models-limits?utm_source=chatgpt.com "ChatGPT Business - Models & Limits"
[2]: https://developers.openai.com/api/docs/models/gpt-5-mini?utm_source=chatgpt.com "GPT-5 mini Model | OpenAI API"
[3]: https://developers.openai.com/api/docs/models/o3?utm_source=chatgpt.com "o3 Model | OpenAI API"

## Changes by Plan [(ref)](https://chatgpt.com/pricing/)
### Instant (GPT-5.3 Instant)
| Plan             | Max tokens |
| ---------------- | ---------- |
| Free             | **16K**    |
| Go / Plus        | **32K**    |
| Pro / Enterprise | **128K**   |
### Thinking (GPT-5.4 Thinking)
| Plan             | Context behavior                 |
| ---------------- | -------------------------------- |
| Free             | No full GPT-5.4 (uses mini/nano) |
| Plus             | ~196K but limited usage          |
| Pro / Enterprise | ~196K full access                |

### Notes
The effective usable context after overhead like system prompt, tooling, memory etc. could be estimated as follows (these numbers are used by our extension by default, but can be adjusted by users):
| Model            | Usable input (real-world) |
| ---------------- | ------------------------- |
| GPT-5.3 Free     | ~12K–14K                  |
| GPT-5.3 Plus     | ~25K–30K                  |
| GPT-5.3 Pro      | ~100K–115K                |
| GPT-5.4 Thinking | ~120K–170K                |

