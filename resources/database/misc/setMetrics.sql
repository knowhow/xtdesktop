select setMetric('desktop/welcome',
                 'http://welcome.xtuple.org/index.html?' ||
                 'ServerVersion=' || fetchmetrictext('ServerVersion') || '&' ||
                 'Application=' || fetchmetrictext('Application') );
select setMetric('desktop/timer','900000');