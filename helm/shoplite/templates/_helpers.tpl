{{- define "shoplite.image" -}}
{{- $tag := required "image.tag is required" .root.Values.image.tag -}}
{{- with .root.Values.image.registry }}{{ . }}/{{ end }}shoplite/{{ .service }}:{{ $tag }}
{{- end }}

{{- define "shoplite.labels" -}}
app.kubernetes.io/name: {{ . }}
app.kubernetes.io/part-of: shoplite
{{- end }}

{{- define "shoplite.postgresEnv" -}}
- name: POSTGRES_PASSWORD
  valueFrom:
    secretKeyRef: { name: {{ .Values.database.existingSecret }}, key: password }
- name: POSTGRES_URL
  value: postgresql://{{ .Values.database.user }}:$(POSTGRES_PASSWORD)@postgres:5432/{{ .Values.database.name }}
{{- end }}

{{- define "shoplite.podSecurity" -}}
runAsNonRoot: true
runAsUser: {{ . }}
runAsGroup: {{ . }}
fsGroup: {{ . }}
seccompProfile: { type: RuntimeDefault }
{{- end }}

{{- define "shoplite.containerSecurity" -}}
allowPrivilegeEscalation: false
readOnlyRootFilesystem: true
capabilities: { drop: [ALL] }
{{- end }}
