import { generateConfig } from "../src/generateConfig"
import { Config } from "relay-compiler/lib/bin/RelayCompilerMain"
import { LocalServiceConfig } from "apollo-language-server/lib/config"
import { ValidationRule } from "graphql/validation"

const defaultMockedConfig = {
  config: {
    schema: "path/to/schema.graphql",
    src: "path/to/src-root",
  } as Config,
}

let mockedConfig: { config: Config } = defaultMockedConfig

function resetToDefaultConfig() {
  mockedConfig = defaultMockedConfig
}

jest.mock("cosmiconfig", () => () => ({
  searchSync: () => mockedConfig,
}))

describe(generateConfig, () => {
  afterEach(() => {
    resetToDefaultConfig()
  })
  xdescribe("when user does not use relay-config", () => {
    it("uses a default schema file", () => {
      jest.mock("relay-config", () => ({ loadConfig: () => null }))
      const config = generateConfig().config.client!.service as LocalServiceConfig
      expect(config.localSchemaFile).toEqual("./data/schema.graphql")
    })

    it("uses a default source root", () => {
      jest.mock("relay-config", () => ({ loadConfig: () => null }))
      const config = generateConfig().config.client!
      expect(config.includes).toEqual("./src/**/*.{graphql,js,jsx}")
    })
  })

  it("specifies the schema file", () => {
    const config = generateConfig().config.client!.service as LocalServiceConfig
    expect(config.localSchemaFile).toEqual("path/to/schema.graphql")
  })

  it("specifies the source files to include", () => {
    const config = generateConfig().config.client!
    expect(config.includes).toContain("path/to/src-root/**/*.{graphql,js,jsx}")
  })

  it("specifies the source files to exclude", () => {
    mockedConfig = {
      config: {
        ...defaultMockedConfig.config,
        exclude: ["path/to/exclude"],
      },
    }
    const config = generateConfig().config.client!
    expect(config.excludes).toContain("path/to/src-root/path/to/exclude")
  })

  it("excludes validation rules that are incompatible with Relay", () => {
    const config = generateConfig().config.client!
    const rules = config.validationRules as ValidationRule[]
    expect(rules.map(({ name }) => name)).not.toContain("NoUndefinedVariables")
  })

  it("includes the RelayUnknownArgumentNames validation rule", () => {
    const config = generateConfig().config.client!
    const rules = config.validationRules as ValidationRule[]
    expect(rules.map(({ name }) => name)).toContain("RelayKnownArgumentNames")
  })

  it("specifies the relay-compiler directives dump to include", () => {
    const config = generateConfig().config.client!
    expect(config.includes).toContainEqual(expect.stringMatching(/relay-compiler-directives-v\d\.\d\.\d/))
  })

  it("Respects includes", () => {
    mockedConfig = {
      config: {
        ...defaultMockedConfig.config,
        include: ["some/files/to/include/**"],
      },
    }

    const config = generateConfig().config.client!
    expect(config.includes).toContain("path/to/src-root/some/files/to/include/**")
  })

  it.todo("specifies the source files to include with a different language plugin")
})
