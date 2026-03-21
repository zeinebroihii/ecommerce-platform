List<String> vals = new List<String>{
    'Computing', 'Graphics', 'Storage', 'Power Protection',
    'Connectivity', 'Networking', 'Sensors & Monitoring', 'Sustainability'
};

Metadata.StandardValueSet svs = new Metadata.StandardValueSet();
svs.fullName = 'ProductFamily';
svs.sorted = false;

List<Metadata.StandardValue> svList = new List<Metadata.StandardValue>();
for (String v : vals) {
    Metadata.StandardValue sv = new Metadata.StandardValue();
    sv.fullName = v;
    sv.default_x = false;
    sv.label = v;
    svList.add(sv);
}
svs.standardValue = svList;

Metadata.DeployContainer mdContainer = new Metadata.DeployContainer();
mdContainer.addMetadata(svs);

Id jobId = Metadata.Operations.enqueueDeployment(mdContainer, null);
System.debug('Deploy job ID: ' + jobId);
