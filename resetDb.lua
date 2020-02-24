function resetRecord(r)
  r['seen'] ='false'
  aerospike:update(r)
  end