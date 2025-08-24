# x: print each command
set -x
cd python-mcp

# initialize the project if pyproject.toml does not exist
if [ ! -f pyproject.toml ]; then
  uv init
fi

# delete old lock file to ensure a clean installation
rm -f uv.lock

# add dependencies one by one
uv add mcp-server-fetch
uv add mcp-server-make
uv add mcp-server-sqlite
uv add mcp-tinybird
uv add mcp-server-aidd
uv add mcp-server-tree-sitter
uv add docker-mcp
uv add awslabs.nova-canvas-mcp-server
uv add mcp-solver
uv add mcp-rememberizer-vectordb
uv add mcp-server-rememberizer
uv add mcp-server-sentry
uv add mcp-server-perplexity
uv add qanon_mcp
uv add mcp-server-git
uv add mcp-server-time
uv add nautobot-mcp
uv add azure-fhir-mcp-server
uv add aptos
uv add wegene
uv add fulcra-context-mcp
uv add garth-mcp-server
uv add oura
uv add whoop
uv add videodb-director-mcp
uv add mcp-server-garmincn
uv add thirdweb-mcp
uv add zillow
uv add openai-agents
uv add unichat-mcp-server
uv add magg
uv add aipolabs-mcp
uv add rapidapi
uv add llm-gateway
uv add mcptoolkit
uv add gateway
uv add acp-mcp-server
uv add union
uv add jentic
uv add mcp-superiorapis
uv add llm_bridge_mcp
uv add photoshop
uv add speckle
uv add processing
uv add mureka-mcp
uv add blender-mcp
uv add heygen-mcp
uv add grasshopper-mcp
uv add mcp-server-ancestry
uv add nasa-mcp
uv add comfyui
uv add comfy-mcp-server
uv add wikipedia
uv add mcp-sonic-pi
uv add ableton-mcp
uv add apple-books-mcp
uv add sketchfab-mcp
uv add trakt
uv add biomcp-python
uv add midjourney
uv add penpot-mcp
uv add undetected-chromedriver
uv add web-scraper
uv add mcp-pyautogui-server
uv add scrapling-fetch-mcp
uv add mcp-playwright-scraper
uv add mcp_server_browser_use
uv add mcp-rquest
uv add browser-use
uv add browser-use-mcp-server
uv add notte-browser
uv add computer-control-mcp
uv add skyvern
uv add browser-use-mcp
uv add mcp-browser-use
uv add twitter
uv add web-crawler
uv add mcp-server-chatgpt-app
uv add gcp-mcp
uv add alibabacloud-mcp-server
uv add azure
uv add yourware-mcp
uv add gcp-mcp-server
uv add aws-ec2-pricing
uv add linode-mcp
uv add aws-lambda
uv add awslabs.cdk-mcp-server
uv add modal
uv add mcp-python-interpreter
uv add docker-executor
uv add mcp-python
uv add python-local
uv add jupyter_mcp_server
uv add serena
uv add code-analysis
uv add mcp-perplexity
uv add deepview-mcp
uv add mcp-server-code-assist
uv add claude-code
uv add codechecker

echo "All Python dependencies have been installed successfully."
