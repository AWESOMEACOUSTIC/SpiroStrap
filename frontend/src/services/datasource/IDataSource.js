// Interface-like contract for data sources.
// Implementations should provide connect(), disconnect(), and onSample(callback).

export class IDataSource {
  async connect() {
    throw new Error("Not implemented");
  }

  async disconnect() {
    throw new Error("Not implemented");
  }

  onSample(_callback) {
    throw new Error("Not implemented");
  }
}
