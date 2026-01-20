import { FetchFunction, loadApiKey } from "@ai-sdk/provider-utils";
import { DifyChatSettings, DifyChatModelId } from "./dify-chat-settings";
import { DifyChatLanguageModel } from "./dify-chat-language-model";
import {
  LanguageModelV3,
  NoSuchModelError,
  ProviderV3,
} from '@ai-sdk/provider';

// model factory function with additional methods and properties
export interface DifyProvider extends ProviderV3 {
  (modelId: DifyChatModelId,settings?: DifyChatSettings): LanguageModelV3;

  // explicit method for targeting the chat API
  languageModel(modelId: DifyChatModelId,settings?: DifyChatSettings): LanguageModelV3;
  chat(modelId: DifyChatModelId,settings?: DifyChatSettings): LanguageModelV3;
}

// optional settings for the provider
export interface DifyProviderSettings {
  /**
   * Use a different URL prefix for API calls, e.g. to use self-hosted Dify instance.
   */
  baseURL?: string;
    /**
   * API key.
   */
  apiKey?: string;


  /**
   * Custom headers to include in the requests.
   */
  headers?: Record<string, string>;
  /**
   * Custom fetch implementation. You can use it as a middleware to intercept requests,
   * or to provide a custom fetch implementation for e.g. testing.
   */
  fetch?: FetchFunction;
}

export function createDifyProvider(
  options: DifyProviderSettings = {}
): DifyProvider {
  const createChatModel = (
    modelId: DifyChatModelId,
    settings: DifyChatSettings = {}
  ) =>
    new DifyChatLanguageModel(modelId, settings, {
      provider: "dify.chat",
      baseURL: options.baseURL || "https://api.dify.ai/v1",
      headers: () => ({
        Authorization: `Bearer ${loadApiKey({
          apiKey: settings.apiKey,
          environmentVariableName: "DIFY_API_KEY",
          description: "Dify API Key",
        })}`,
        "Content-Type": "application/json",
        ...options.headers,
      }),
    });

  const provider = function (
    modelId: DifyChatModelId,
    settings?: DifyChatSettings
  ) {
    if (new.target) {
      throw new Error(
        "The model factory function cannot be called with the new keyword."
      );
    }

    return createChatModel(modelId, settings);
  };

  provider.specificationVersion = 'v3' as const;
  provider.chat = createChatModel;
  provider.languageModel = createChatModel;
  provider.embeddingModel = (modelId: string) => {
    throw new NoSuchModelError({ modelId, modelType: 'embeddingModel' });
  };
  provider.imageModel = (modelId: string) => {
      throw new NoSuchModelError({ modelId, modelType: 'imageModel' });
    };

  return provider;
}

/**
 * Default Dify provider instance.
 */
export const difyProvider = createDifyProvider();
