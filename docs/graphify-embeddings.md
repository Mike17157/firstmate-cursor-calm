# Graphify semantic embeddings

`bin/fm-graphify-embed.py` enriches an existing Graphify JSON export without changing the input file.

The command reads `graphify-out/graph.json` by default, or the path supplied with `--input`.
It writes a visualization-ready JSON graph to the required `--output` path.

## Run it

Configure the endpoint and model explicitly for each run.
Keep the API credential in the environment instead of passing it as an argument.

```sh
OPENAI_API_KEY="$OPENAI_API_KEY" \
  bin/fm-graphify-embed.py \
  --input graphify-out/graph.json \
  --endpoint https://embedding.example.invalid/v1/embeddings \
  --model text-embedding-3-small \
  --threshold 0.82 \
  --top-k 3 \
  --output graphify-out/graph-semantic.json
```

`--endpoint` may name an OpenAI-compatible `/embeddings` route or a base URL to which `/embeddings` is appended.
The endpoint must be an absolute HTTP or HTTPS URL.
`--model`, `--threshold`, `--top-k`, and `--output` are required so the embedding and clustering choices are visible in the command.
The endpoint and model may instead come from `GRAPHIFY_EMBEDDINGS_ENDPOINT` and `GRAPHIFY_EMBEDDINGS_MODEL` when a local wrapper needs environment configuration.
A missing endpoint or model produces an actionable error before any network call.
The default credential variable is `OPENAI_API_KEY`, and `--api-key-env NAME` selects another environment variable without exposing its value to the process arguments or diagnostics.
A provider that does not require authentication may omit the credential variable.

The tool sends JSON requests shaped like the OpenAI embeddings API: `{"input": [...], "model": "..."}`.
It accepts the standard response shape `{"data": [{"index": 0, "embedding": [...]}, ...]}` and rejects missing, non-finite, empty, inconsistent, or duplicate vectors.
Provider failures report only an HTTP status or a safe connection/response error, never the response body or authorization header.

## Fingerprints and clustering

Each embedding input is a canonical JSON fingerprint, not a prose summary.
The fingerprint contains the node label, source path, sorted incident relation types, and at most twelve sorted neighbor records containing direction, relation type, and neighbor label.
The reader accepts Graphify node arrays or id-keyed node objects.
It recognizes common node fields including `id`, `label`, `name`, `title`, `source_path`, `sourcePath`, `file_path`, `filePath`, `path`, and `file`.
It recognizes common edge endpoint fields including `source`/`target`, `from`/`to`, and `src`/`dst`.
It recognizes `relation`, `type`, `kind`, `label`, and `edge_type` as relation fields.
Unknown endpoint references and malformed graph structures stop the command safely.

Cosine similarity is computed locally from the returned vectors.
For each node, candidates at or above `--threshold` are sorted by descending similarity and then node id, and only the first `--top-k` candidates become semantic edges.
Threshold-qualified edges form connected components, so no predefined taxonomy or cluster count is required.
Each component receives a stable `semantic-cluster-<sha256-prefix>` identifier derived from its sorted node ids.

Output nodes receive `semantic_cluster_id`.
If an input node already has that field, the tool uses `graphify_semantic_cluster_id` so the input value is preserved.
Output edges retain every original edge and append `type` and `relation` set to `semantically_similar_to`, with a numeric `similarity` score.
The tool never removes authoritative AST edges and never writes the input path in place.
Repeated runs with identical input, provider vectors, threshold, and top-k produce the same semantic identifiers and edge ordering.

This command only performs embedding and graph enrichment.
Jev labeling and free-form generation are separate follow-up work and are not invoked by this tool.
